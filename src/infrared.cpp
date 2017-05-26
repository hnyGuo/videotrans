#ifndef UNICODE
#define UNICODE
#endif

#include <node.h>
#include <v8.h>
#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <opencv2/video/video.hpp>
#include <iostream>
#include <cstdio>
#include <fstream>
#include <uv.h>
#include <vector>
#include <mutex>
#include "VideoDisplay.h"
#include <time.h>
#include <math.h>
#include <iomanip>
// IR Imager device interfaces
#include "IRDeviceDS.h"

// IR Imager imager interfaces
#include "IRImager.h"

// IR Imager logging interface
#include "IRLogger.h"

// IR Imager image converter
#include "ImageBuilder.h"

// Raw video interface
#include "VideoCapture.h"

// Helper class to measure the achievable frame rate
#include "FramerateCounter.h"

// Helper class to maintain and query calibration data
#include "IRCalibrationManager.h"

using namespace v8;
using namespace std;

evo::IRImager*         _imagers[4];

evo::FramerateCounter* _frc[4];

unsigned char*         _thermalImages[4];

VideoDisplay*          _displays[4];

int m_brk;
uv_async_t async;
uv_loop_t *loop;

struct TMessage {
	Persistent<Function> callBack;
	evo::VideoCapture *vc;
	vector<evo::IRDeviceDS*> devices;
	vector<evo::IRDeviceParams> params;
	~TMessage() {
		callBack.Reset();
	}
};

struct AsyncMessage {
	vector<unsigned char> image;
	float meanTemperature;
};

TMessage *message;
unsigned char* thermalImage;
float meanTemp,diffTemp;
evo::ExtremalRegion minRegion, maxRegion;
int u1 = 50, v1 = 40, u2 = 110, v2 = 80;
mutex mtx;
// Function called be DirectShow interface when a new frame has been acquired.
// Multiple cameras are distinguished by the variable id.
void onRawFrame(unsigned char* data, int len, int id)
{
	double fps;
	if (_frc[id]->trigger(&fps)) {
		//std::cout << "Frame rate: " << fps << " fps" << std::endl;
	}
	int arg = id;
	_imagers[id]->process(data, &arg);
}

// Function called within process call of IRImager instance.
// Keep this function free of heavy processing load. Otherwise the frame rate will drop down significantly for the control loop.
// With the optional argument, one can distinguish between multiple instances.
// A more sophisticated way to do so, is the usage of the object oriented interface (IRImagerClient).
void onThermalFrame(unsigned short* image, unsigned int w, unsigned int h, evo::IRFrameMetadata meta, void* arg)
{
	evo::ImageBuilder iBuilder;
	iBuilder.setPaletteScalingMethod(evo::eMinMax);
	iBuilder.setPalette(evo::eIron);
	iBuilder.setData(w, h, image);
	//float temp = iBuilder.getTemperatureAt(1, 1);
	//printf("width:%d,height:%d\n", w,h);
	int* instance = (int*)arg;
	if (_thermalImages[*instance] == NULL)
		_thermalImages[*instance] = new unsigned char[iBuilder.getStride() * h * 3];
	thermalImage = _thermalImages[*instance];
	
	meanTemp = iBuilder.getMeanTemperature(u1, v1, u2, v2);
	
	iBuilder.getMinMaxRegion(10, &minRegion, &maxRegion);
	diffTemp = maxRegion.t-minRegion.t;
	iBuilder.convertTemperatureToPaletteImage(thermalImage);

	//_displays[*instance]->drawCapture(0, 0, iBuilder.getStride(), h, 24, thermalImage);
}

// Function called within process call of IRImager instance, every time the state of the shutter flag changes.
// The flag state changes either automatically or by calling the forceFlagEvent method of IRImager.
void onFlageStateChange(evo::EnumFlagState fs, void* arg)
{
	//std::cout << "Flag state for instance " << *((int*)(arg)) << ": " << fs << std::endl;
}

void updateAsync(uv_async_t*req, int status) {
	Isolate* isolate = Isolate::GetCurrent();
	HandleScope scope(isolate);
	AsyncMessage* asyncMessage = (AsyncMessage*)req->data;

	Local<Function> callBack = Local<Function>::New(isolate, message->callBack);
	
	Local<Array> arr = Array::New(isolate, asyncMessage->image.size());
	Local<Object> temperature = Object::New(isolate);
	temperature->Set(String::NewFromUtf8(isolate, "temperature"), Number::New(isolate, asyncMessage->meanTemperature));
	int pos = 0;
	for (unsigned char c : asyncMessage->image) {
		arr->Set(pos++, Integer::New(isolate, c));
	}
	Local<Value> argv[] = {
		arr,
		temperature
	};
	callBack->Call(isolate->GetCurrentContext()->Global(), 2, argv);
	asyncMessage->image.clear();
	delete asyncMessage;
}

void infraredOpen(uv_work_t* req) {
	clock_t start, end;
	while (m_brk > 0) {
		AsyncMessage *msg = new AsyncMessage();
		if (thermalImage != NULL) {
			if (mtx.try_lock()) {
				start = clock();
				cv::Mat mat(120, 160, CV_8UC3, thermalImage);
				//_displays[0]->drawCapture(0, 0, 160, 120, 24, thermalImage);
				//cv::imshow("preview", mat);
				stringstream str,str1;
				//str << (int)(meanTemp*100)/100.0 ;
				msg->meanTemperature = diffTemp; //项目方要求最高温与最低温的差值作为报警信号
				str << setiosflags(ios::fixed) << setprecision(2) << meanTemp;
				str1 << setiosflags(ios::fixed) << setprecision(2) << diffTemp;
				//printf("%s\n",str.str());
				cv::rectangle(mat, cvPoint(u1, v1), cvPoint(u2, v2), cvScalar(255, 255, 255), 1, 8, 0);
				cv::rectangle(mat, cvPoint(maxRegion.u1, maxRegion.v1), cvPoint(maxRegion.u2, maxRegion.v2), cvScalar(0, 0, 255), 1, 8, 0);
				cv::rectangle(mat, cvPoint(minRegion.u1, minRegion.v1), cvPoint(minRegion.u2, minRegion.v2), cvScalar(0, 255, 0), 1, 8, 0);
				cv::putText(mat, str.str(), cvPoint(u2, v1), CV_FONT_HERSHEY_SIMPLEX, 0.5, cvScalar(0, 0, 255), 1, 8);
				cv::putText(mat, str1.str(), cvPoint(u2, v2), CV_FONT_HERSHEY_SIMPLEX, 0.5, cvScalar(0, 255, 0), 1, 8);
				std::vector<int> compression_parameters = std::vector<int>(2);
				compression_parameters[0] = CV_IMWRITE_JPEG_QUALITY;
				compression_parameters[1] = 85; //85     压缩比例
				vector<unsigned char> image;
				cv::imencode(".jpg", mat, msg->image, compression_parameters);
		 		async.data = msg;
				uv_async_send(&async);
				//printf("size:%d\n", msg->image.size());
			}
			mtx.unlock();
		}
		_sleep(30);
		end = clock();
		double duration = end - start;
		//printf("Use time：%f\n", duration / CLOCKS_PER_SEC);
	}
}

void infraredClose(uv_work_t* req, int status) {
	Isolate* isolate = Isolate::GetCurrent();
	HandleScope scope(isolate);
	TMessage* message = (TMessage*)req->data;
	for (unsigned int i = 0; i < message->devices.size(); i++)
	{
		int st=message->devices[i]->stopStreaming();
		//printf("st:%d\n",st);
		delete _frc[i];
		delete _imagers[i];
		if (_thermalImages[i])  delete _thermalImages[i];
		if (_displays[i])       delete _displays[i];
	}
	message->devices.clear();
	message->params.clear();
	delete message->vc;
}

void IsOpen(const FunctionCallbackInfo<Value>& args) {
	Isolate* isolate = Isolate::GetCurrent();
	HandleScope scope(isolate);
	args.GetReturnValue().Set(Boolean::New(isolate, (m_brk == 1) ? TRUE : FALSE));
}

void GetPreviewSize(const FunctionCallbackInfo<Value>& args) {
	Isolate* isolate = Isolate::GetCurrent();
	HandleScope scope(isolate);
	Local<Object> obj = Object::New(isolate);
	obj->Set(String::NewFromUtf8(isolate, "width"), Integer::New(isolate, 160));
	obj->Set(String::NewFromUtf8(isolate, "height"), Integer::New(isolate, 121));
	args.GetReturnValue().Set(obj);
}

void Open(const FunctionCallbackInfo<Value>& args) {
	Isolate* isolate = Isolate::GetCurrent();
	HandleScope scope(isolate);
	loop = uv_default_loop();
	message = new TMessage;
	m_brk = 1;
	message->callBack.Reset(isolate, Handle<Function>::Cast(args[0]));

	std::string filename = "";
	evo::IRLogger::setVerbosity(evo::IRLOG_ERROR, evo::IRLOG_OFF, filename.c_str());

	message->vc=new evo::VideoCapture;
	char* arg = "D:/videotrans/sdk/generic.xml";
	// Windows SDK is compiled using 16-bit Unicode characters
	size_t argSize = strlen(arg) + 1;
	wchar_t* argPath = new wchar_t[argSize];
	mbstowcs(argPath, arg, argSize);

	evo::IRDeviceParams p;
	if (evo::IRDeviceParamsReader::readXML(argPath, p) == false)
		cout << "Could not open configuration file!" << endl;
	delete argPath;

	evo::IRDeviceDS* device = message->vc->initializeDevice(p);

	if (device)
	{
		message->devices.push_back(device);
		message->params.push_back(p);

		evo::IRCalibrationManager* caliManager = evo::IRCalibrationManager::getInstance();
		caliManager->setCalibrationDir(p.caliPath);
		caliManager->setFormatsDir(p.formatsPath);

		// Output available optics
		const std::vector<int>* optics = caliManager->getAvailableOptics(device->getSerial());
		std::cout << "Available optics for camera with serial " << device->getSerial() << ": ";
		for (unsigned int i = 0; i < optics->size(); i++)
			std::cout << (*optics)[i] << " deg ";
		std::cout << std::endl;
		message->vc->run();
		
		evo::IRDeviceDS* device = message->devices[0];
		_imagers[0] = new evo::IRImager();
		_frc[0] = new evo::FramerateCounter(1000.0, device->getFrequency());
		_displays[0] = NULL;
		_thermalImages[0] = NULL;

		evo::IRImager* imager = _imagers[0];
		//printf("device->width:%d  device->height:%d\n", device->getWidth(), device->getHeight());
		if (imager->init(&message->params[0], device->getFrequency(), device->getWidth(), device->getHeight()))
		{
			imager->setFrameCallback(onThermalFrame);
			imager->setFlagStateCallback(onFlageStateChange);
			device->setCallback(onRawFrame);
			device->startStreaming();
			//_displays[0] = new VideoDisplay(imager->getWidth(), imager->getHeight());
			//if (i<(devices.size() - 1))
			//_displays[i]->showDetach();
			//else
			_sleep(500);
			uv_work_t* req = new uv_work_t();
			req->data = message;
			async = uv_async_t();
			uv_async_init(loop, &async, (uv_async_cb)updateAsync);
			uv_queue_work(loop, req, infraredOpen, (uv_after_work_cb)infraredClose);
			//_displays[0]->show();
		}
	}
	else
	{
		std::cout << "IR Imager device(s) could not be found" << std::endl;
	}
	args.GetReturnValue().Set(String::NewFromUtf8(isolate, "infrared camera is opened"));
}

void Close(const FunctionCallbackInfo<Value>& args) {
	Isolate* isolate = Isolate::GetCurrent();
	HandleScope scope(isolate);
	m_brk = 0;
	uv_loop_close(loop);
	//uv_close((uv_handle_t *)&async, NULL);
	args.GetReturnValue().Set(String::NewFromUtf8(isolate, "ok"));
}

void init(Handle<Object> exports) {
	Isolate* isolate = Isolate::GetCurrent();
	HandleScope scope(isolate);
	exports->Set(String::NewFromUtf8(isolate, "Open"), FunctionTemplate::New(isolate, Open)->GetFunction());
	exports->Set(String::NewFromUtf8(isolate, "Close"), FunctionTemplate::New(isolate, Close)->GetFunction());
	exports->Set(String::NewFromUtf8(isolate, "IsOpen"), FunctionTemplate::New(isolate, IsOpen)->GetFunction());
	exports->Set(String::NewFromUtf8(isolate, "GetPreviewSize"), FunctionTemplate::New(isolate, GetPreviewSize)->GetFunction());
}

NODE_MODULE(infrared,init)