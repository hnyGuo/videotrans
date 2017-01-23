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
    }
    ]
}