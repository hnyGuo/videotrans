{
    "targets": [
        {
            "target_name": "camera",
            "sources": ["src/camera.cpp"],
            "link_settings": {
                "libraries": ["opencv_world320.lib"]
            },
            "cflags": [
                "-g", "-std=c++11", "-Wall"
            ],
            "conditions": [
                ['OS=="linux"', {
                    'include_dirs': [
                        '/usr/include'
                        ],
                    'link_settings': {
                        'library_dirs': ['/usr/share/lib']
                    },
                    'cflags!': ['-fno-exceptions'],
                    'cflags_cc!': ['-fno-rtti', '-fno-exceptions']
                }],
                ['OS=="mac"', {
                    'include_dirs': [
                        '/opt/local/include'
                        ],
                    'link_settings': {
                        'library_dirs': ['/opt/local/lib']
                    },
                    'xcode_settings': {
                        'MACOSX_DEPLOYMENT_TARGET' : '10.7',
                        'OTHER_CFLAGS': [
                            "-mmacosx-version-min=10.7",
                            "-std=c++11",
                            "-stdlib=libc++"
                        ],
                        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
                        'GCC_ENABLE_CPP_RTTI': 'YES'
                    }
                }],
                ['OS=="win32"', {
                    'include_dirs': [
                        'D:/opencv/build/include'
                        ],
                    'link_settings': {
                        'library_dirs': ['D:/opencv/build/x64/vc14/lib']
                    },
                    'cflags!': ['-fno-exceptions'],
                    'cflags_cc!': ['-fno-rtti', '-fno-exceptions']
                }]
            ]
        },
        {
            "target_name": "wifi",
            "sources": ["src/wifi.cpp"],
            "link_settings": {
                "libraries": ["wlanapi.lib","ole32.lib"]
            },
            "cflags": [
                "-g", "-std=c++11", "-Wall"
            ],
            "conditions": [
                ['OS=="win32"', {
                    'include_dirs': [
                        'C:/Program Files (x86)/Windows Kits/8.1/Include/um'
                        ],
                    'link_settings': {
                        'library_dirs': ['C:/Program Files (x86)/Windows Kits/8.1/Lib/winv6.3/um/x64']
                    },
                    'cflags!': ['-fno-exceptions'],
                    'cflags_cc!': ['-fno-rtti', '-fno-exceptions']
                }]
            ]
        },
        {
            "target_name": "infrared",
            "sources": ["src/infrared.cpp"],
            "link_settings": {
                "libraries": ["libirimager.lib","opencv_world320.lib"]
            },
            "cflags": [
                "-g", "-std=c++11", "-Wall"
            ],
            "conditions": [
                ['OS=="win32"', {
                    'include_dirs': [
                        'sdk'
                        ],
                    'link_settings': {
                        'library_dirs': ['sdk/x64']
                    },
                    'cflags!': ['-fno-exceptions'],
                    'cflags_cc!': ['-fno-rtti', '-fno-exceptions']
                }]
            ]
        }
    ]
}