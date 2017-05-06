#pragma once
#include <windows.h>

/**
* @class VideoDisplay
* @brief Image stream display class. Up to 16 instances can be used simultaneously.
* @author Stefan May (Evocortex GmbH), Matthias Wiedemann (Optris GmbH)
*/
class VideoDisplay
{

public:

  /**
   * Constructor
   */
  VideoDisplay(unsigned int width, unsigned int height);

  /**
   * Destructor
   */
  ~VideoDisplay();

  /**
   * Start display loop (blocking method)
   */
	void show();

  /**
   * Start display loop (non-blocking method), i.e., detach call of show() with child thread
   **/
  void showDetach();

	/**
	 * Draw single frame
	 * @param[in] x x coordinate
	 * @param[in] y y coordinate
	 * @param[in] width image width
	 * @param[in] height image height
	 * @param[in] bpp bits per pixel
	 * @param[in] data image data array
	 */
	void drawCapture(int x, int y, int width, int height, int bpp, unsigned char* data);

protected:

  void messageLoop();

	static VideoDisplay* _instance;

  bool                 _valid;

private:

  static LRESULT CALLBACK MessageHandler(HWND hwnd, UINT msg, WPARAM wparam, LPARAM lparam);

	HWND                 _window;

	HDC                  _backbuffer;

	HBITMAP	             _backbitmap;

  unsigned int         _instanceID;

};
