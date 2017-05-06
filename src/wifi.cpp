#ifndef UNICODE
#define UNICODE
#endif

#include <node.h>
#include <v8.h>
#include <Windows.h>
#include <wlanapi.h>
#include <objbase.h>
#include <wtypes.h>
#include <stdio.h>
#include <stdlib.h>
#include <sstream>
#include <vector>
#include <string>
using namespace v8;
using namespace std;

#pragma comment(lib,"wlanapi.lib")
#pragma comment(lib,"ole32.lib")

void wifiScan(const FunctionCallbackInfo<Value>& args) {
	Isolate* isolate = Isolate::GetCurrent();
	HandleScope scope(isolate);
	Local<Array> wifiList;
	vector<string> wifiVector;
	wifiVector.clear();

	HANDLE hClient = NULL;
	DWORD dwMaxClient = 2;
	DWORD dwCurVersion = 0;
	DWORD dwResult = 0;
	DWORD dwRetVal = 0;
	int iRet = 0;
	WCHAR GuidString[39] = { 0 };
	unsigned int i, j, k;
	PWLAN_INTERFACE_INFO_LIST pIfList = NULL;
	PWLAN_INTERFACE_INFO pIfInfo = NULL;

	PWLAN_AVAILABLE_NETWORK_LIST pBssList = NULL;
	PWLAN_AVAILABLE_NETWORK pBssEntry = NULL;

	int iRSSI = 0;

	dwResult = WlanOpenHandle(dwMaxClient, NULL, &dwCurVersion, &hClient);
	dwResult = WlanEnumInterfaces(hClient, NULL, &pIfList);
	//wprintf(L"Num Entries:%lu\n", pIfList->dwNumberOfItems);
	//wprintf(L"Current Index:%lu\n", pIfList->dwIndex);

	for (i = 0; i < (int)pIfList->dwNumberOfItems; i++) {
		pIfInfo = (WLAN_INTERFACE_INFO *)&pIfList->InterfaceInfo[i];
		//wprintf(L"Interface Index[%d]:\t%lu\n", i, i);
		iRet = StringFromGUID2(pIfInfo->InterfaceGuid, (LPOLESTR)&GuidString, 39);
		if (iRet == 0) {
			//wprintf(L"StringFromGUID2 failed\n");
		}
		else {
			//wprintf(L"InterfaceGUID[%d]:%ws\n", i, GuidString);
		}

		dwResult = WlanGetAvailableNetworkList(hClient, &pIfInfo->InterfaceGuid, 0, NULL, &pBssList);

		if (dwResult != ERROR_SUCCESS) {
			//wprintf(L"WlanGetAvailableNetworkList failed with error:%u\n", dwResult);
			dwRetVal = 1;
		}
		else {
			//wprintf(L"Num Entries:%lu\n\n", pBssList->dwNumberOfItems);
			wifiList = Array::New(isolate, pBssList->dwNumberOfItems);

			for (j = 0; j < pBssList->dwNumberOfItems; j++) {
				Local<Object> wifi = Object::New(isolate);//新建一个wifi对象
				std::stringstream ss;

				pBssEntry = (WLAN_AVAILABLE_NETWORK *)&pBssList->Network[j];
				//wprintf(L"Profile Name[%u]:%ws\n", j, pBssEntry->strProfileName);
				//wprintf(L"SSID[%u]:\t\t", j);
				
				if (pBssEntry->dot11Ssid.uSSIDLength == 0) {
					//wprintf(L"\n");
				}
				else {
					for (k = 0; k < pBssEntry->dot11Ssid.uSSIDLength; k++) {
						//wprintf(L"%c", (int)pBssEntry->dot11Ssid.ucSSID[k]);
						ss<<pBssEntry->dot11Ssid.ucSSID[k];
					}
					
					//wprintf(L"\n");
				}
				if (pBssEntry->wlanSignalQuality == 0)
					iRSSI = -100;
				else if (pBssEntry->wlanSignalQuality == 100)
					iRSSI = -50;
				else
					iRSSI = -100 + (pBssEntry->wlanSignalQuality / 2);
				//wprintf(L"Signal Quality[%u]:\t%u(RSSI:%i dBm)\n", j, pBssEntry->wlanSignalQuality, iRSSI);
				
				//wprintf(L"Flags[%u]:\t0x%x", j, pBssEntry->dwFlags);
				/*if (pBssEntry->dwFlags) {
					if (pBssEntry->dwFlags&WLAN_AVAILABLE_NETWORK_CONNECTED)
						wprintf(L"- Currently connected");
					if (pBssEntry->dwFlags&WLAN_AVAILABLE_NETWORK_CONNECTED)
						wprintf(L"- Has profile");
				}
				wprintf(L"\n\n");*/

				string temp = ss.str();
				vector<string>::iterator it;
				it = find(wifiVector.begin(), wifiVector.end(), temp);
				if (it == wifiVector.end()) {
					wifiVector.push_back(temp);
					wifi->Set(String::NewFromUtf8(isolate, "ssid"), String::NewFromUtf8(isolate, temp.c_str()));//读取SSID
					wifi->Set(String::NewFromUtf8(isolate, "signalQuality"), Integer::New(isolate, (int)pBssEntry->wlanSignalQuality));//读取wifi信号质量
					wifiList->Set(j, wifi); //将单个wifi对象装入wifiList数组
				}
			}
		}
	}
	if (pBssList != NULL) {
		WlanFreeMemory(pBssList);
		pBssList = NULL;
	}
	if (pIfList != NULL) {
		WlanFreeMemory(pIfList);
		pIfList = NULL;
	}
	dwResult = WlanCloseHandle(hClient,NULL);
	args.GetReturnValue().Set(wifiList);
}

void init(Handle<Object> target) {
	NODE_SET_METHOD(target, "wifiScan", wifiScan);
}

NODE_MODULE(wifi, init)