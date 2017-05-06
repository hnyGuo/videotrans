#include "VideoDisplay.h"
#include <iostream>

bool __displayInstanceMap__[16] = { 0 };
VideoDisplay* __displays__[16];

// Templated display worker function
template <int instance>
DWORD WINAPI displayWorker(LPVOID lpParam)
{
  __displays__[instance]->show();
  return 0;
}
typedef DWORD(*fpDisplayWorker)(LPVOID lpParam);
static fpDisplayWorker displayWorkerSlot[] =
{
  &displayWorker<0>,
  &displayWorker<1>,
  &displayWorker<2>,
  &displayWorker<3>,
  &displayWorker<4>,
  &displayWorker<5>,
  &displayWorker<6>,
  &displayWorker<7>,
  &displayWorker<8>,
  &displayWorker<9>,
  &displayWorker<10>,
  &displayWorker<11>,
  &displayWorker<12>,
  &displayWorker<13>,
  &displayWorker<14>,
  &displayWorker<15>
};

struct WindowInstance
{
	HWND window;
	VideoDisplay* instance;
	struct WindowInstance *next;
};

WindowInstance *root = 0;

VideoDisplay* GetInstance(HWND hwnd)
{
	WindowInstance* ptr = root;
	while (ptr && ptr->window != hwnd) ptr = ptr->next;
	return ptr ? ptr->instance : 0;
}

VideoDisplay::VideoDisplay(unsigned int width, unsigned int height)
{
  // find valid id
  int id = -1;
  for (int i = 0; i<16; i++)
  {
    if (__displayInstanceMap__[i] == false)
    {
      id = i;
      break;
    }
  }
  if (id == -1)
  {
    std::cout << "Maximum number of instances reached ... aborting" << std::endl;
    abort();
  }
  _instanceID = id;
  __displayInstanceMap__[_instanceID] = true;
  __displays__[_instanceID] = this;

	HINSTANCE hinst = GetModuleHandle(NULL);

	//Register Window Class
	WNDCLASSEX windowclass;
	memset(&windowclass,0, sizeof(WNDCLASSEX));
	
	windowclass.cbSize        = sizeof(WNDCLASSEX);
	windowclass.style         = CS_HREDRAW | CS_VREDRAW;
	windowclass.lpfnWndProc   = MessageHandler;
	windowclass.hInstance     = hinst;
	windowclass.hIcon         = LoadIcon(NULL, IDI_APPLICATION);
	windowclass.hCursor       = LoadCursor(NULL, IDC_ARROW);
	windowclass.hbrBackground	= (HBRUSH) GetStockObject(WHITE_BRUSH);
	windowclass.lpszMenuName  = "Main Menu";
	windowclass.lpszClassName = "VideoDisplay";
	windowclass.hIconSm       = (HICON) LoadImage(hinst, MAKEINTRESOURCE(5), IMAGE_ICON, GetSystemMetrics(SM_CYSMICON), GetSystemMetrics(SM_CXSMICON), LR_DEFAULTCOLOR);

	RegisterClassEx(&windowclass);

	//Create the Window
	_window = CreateWindow(	"VideoDisplay", "Optris PI imager example",
                          WS_OVERLAPPEDWINDOW,
                          CW_USEDEFAULT, 0, width, height,
                          NULL, NULL, hinst, NULL);

	//Create a compatible backbuffer
	HDC current = GetDC(_window);
	RECT clientrect;
	
	GetClientRect(_window, &clientrect);
	_backbuffer = CreateCompatibleDC(current);
	_backbitmap = CreateCompatibleBitmap(current, clientrect.right, clientrect.bottom);
	SelectObject(_backbuffer,(HGDIOBJ)_backbitmap);
	ReleaseDC(_window, current);
	
	//add hwnd to instance reference
	WindowInstance** ptr = &root;
	while (*ptr) ptr = &(*ptr)->next;
	*ptr = (WindowInstance*)calloc(1, sizeof(WindowInstance));
	(*ptr)->window = _window;
	(*ptr)->instance = this;

  _valid = true;
}

VideoDisplay::~VideoDisplay()
{
  // free slot for new instances
  __displayInstanceMap__[_instanceID] = false;
}

void VideoDisplay::show()
{
	ShowWindow(_window, SW_SHOWNORMAL);
	UpdateWindow(_window);
	messageLoop();
}

void VideoDisplay::showDetach()
{
  CreateThread(NULL, 0, displayWorkerSlot[_instanceID], NULL, 0, NULL);
}

void VideoDisplay::drawCapture(int x, int y, int width, int height, int bpp, unsigned char* data)
{
  if(!_valid) return;

	BITMAPINFO bmi;
	memset(&bmi, 0, sizeof(BITMAPINFO));
	bmi.bmiHeader.biSize = sizeof(BITMAPINFO);
	bmi.bmiHeader.biWidth = width;
	bmi.bmiHeader.biHeight = -height;
	bmi.bmiHeader.biPlanes = 1;
	bmi.bmiHeader.biBitCount = bpp;
	bmi.bmiHeader.biCompression = BI_RGB;
	SetDIBitsToDevice(_backbuffer,x,y,width,height, 0, 0, 0, (UINT)height, data, &bmi, DIB_RGB_COLORS);

	RECT invalid = {x,y,x+width,y+height};
	InvalidateRect(_window, &invalid, false);
}

void VideoDisplay::messageLoop()
{
	MSG msg;
	while(GetMessage(&msg, 0, 0, 0) > 0)
	{
		TranslateMessage(&msg);
		DispatchMessage(&msg);
	}
}

LRESULT VideoDisplay::MessageHandler(HWND hwnd, UINT msg, WPARAM wparam, LPARAM lparam)
{
	switch (msg)
	{
		case WM_CLOSE:
		{
      RECT clientrect;

      GetClientRect(hwnd, &clientrect);
      VideoDisplay* cw = GetInstance(hwnd);

      cw->_valid = false;
			PostQuitMessage(0);
			return 0;
		}

		case WM_PAINT:
		{
			PAINTSTRUCT ps;
			RECT clientrect;

			GetClientRect(hwnd, &clientrect);
			VideoDisplay* cw = GetInstance(hwnd);
			
			HDC hdc = BeginPaint(hwnd, &ps);
			BitBlt(hdc, 0, 0, clientrect.right, clientrect.bottom, cw->_backbuffer, 0, 0, SRCCOPY);
			EndPaint(hwnd, &ps);

			return 0;
		}

		default: return DefWindowProc(hwnd, msg, wparam, lparam);
	}
}
