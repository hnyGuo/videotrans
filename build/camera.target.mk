# This file is generated by gyp; do not edit.

TOOLSET := target
TARGET := camera
DEFS_Debug := \
	'-DNODE_GYP_MODULE_NAME=camera' \
	'-DUSING_UV_SHARED=1' \
	'-DUSING_V8_SHARED=1' \
	'-DV8_DEPRECATION_WARNINGS=1' \
	'-D_LARGEFILE_SOURCE' \
	'-D_FILE_OFFSET_BITS=64' \
	'-DBUILDING_NODE_EXTENSION' \
	'-DDEBUG' \
	'-D_DEBUG'

# Flags passed to all source files.
CFLAGS_Debug := \
	-fPIC \
	-pthread \
	-Wall \
	-Wextra \
	-Wno-unused-parameter \
	-m64 \
	-g \
	-std=c++11 \
	-Wall \
	-g \
	-O0

# Flags passed to only C files.
CFLAGS_C_Debug :=

# Flags passed to only C++ files.
CFLAGS_CC_Debug := \
	-std=gnu++0x

INCS_Debug := \
	-I/home/robot/.node-gyp/6.7.0/include/node \
	-I/home/robot/.node-gyp/6.7.0/src \
	-I/home/robot/.node-gyp/6.7.0/deps/uv/include \
	-I/home/robot/.node-gyp/6.7.0/deps/v8/include \
	-I/usr/include

DEFS_Release := \
	'-DNODE_GYP_MODULE_NAME=camera' \
	'-DUSING_UV_SHARED=1' \
	'-DUSING_V8_SHARED=1' \
	'-DV8_DEPRECATION_WARNINGS=1' \
	'-D_LARGEFILE_SOURCE' \
	'-D_FILE_OFFSET_BITS=64' \
	'-DBUILDING_NODE_EXTENSION'

# Flags passed to all source files.
CFLAGS_Release := \
	-fPIC \
	-pthread \
	-Wall \
	-Wextra \
	-Wno-unused-parameter \
	-m64 \
	-g \
	-std=c++11 \
	-Wall \
	-O3 \
	-fno-omit-frame-pointer

# Flags passed to only C files.
CFLAGS_C_Release :=

# Flags passed to only C++ files.
CFLAGS_CC_Release := \
	-std=gnu++0x

INCS_Release := \
	-I/home/robot/.node-gyp/6.7.0/include/node \
	-I/home/robot/.node-gyp/6.7.0/src \
	-I/home/robot/.node-gyp/6.7.0/deps/uv/include \
	-I/home/robot/.node-gyp/6.7.0/deps/v8/include \
	-I/usr/include

OBJS := \
	$(obj).target/$(TARGET)/src/camera.o

# Add to the list of files we specially track dependencies for.
all_deps += $(OBJS)

# CFLAGS et al overrides must be target-local.
# See "Target-specific Variable Values" in the GNU Make manual.
$(OBJS): TOOLSET := $(TOOLSET)
$(OBJS): GYP_CFLAGS := $(DEFS_$(BUILDTYPE)) $(INCS_$(BUILDTYPE))  $(CFLAGS_$(BUILDTYPE)) $(CFLAGS_C_$(BUILDTYPE))
$(OBJS): GYP_CXXFLAGS := $(DEFS_$(BUILDTYPE)) $(INCS_$(BUILDTYPE))  $(CFLAGS_$(BUILDTYPE)) $(CFLAGS_CC_$(BUILDTYPE))

# Suffix rules, putting all outputs into $(obj).

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(srcdir)/%.cpp FORCE_DO_CMD
	@$(call do_cmd,cxx,1)

# Try building from generated source, too.

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(obj).$(TOOLSET)/%.cpp FORCE_DO_CMD
	@$(call do_cmd,cxx,1)

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(obj)/%.cpp FORCE_DO_CMD
	@$(call do_cmd,cxx,1)

# End of this set of suffix rules
### Rules for final target.
LDFLAGS_Debug := \
	-pthread \
	-rdynamic \
	-m64 \
	-L/usr/share/lib

LDFLAGS_Release := \
	-pthread \
	-rdynamic \
	-m64 \
	-L/usr/share/lib

LIBS := \
	-lopencv_core \
	-lopencv_highgui \
	-lopencv_imgproc \
	-lopencv_video \
	-lopencv_ml

$(obj).target/camera.node: GYP_LDFLAGS := $(LDFLAGS_$(BUILDTYPE))
$(obj).target/camera.node: LIBS := $(LIBS)
$(obj).target/camera.node: TOOLSET := $(TOOLSET)
$(obj).target/camera.node: $(OBJS) FORCE_DO_CMD
	$(call do_cmd,solink_module)

all_deps += $(obj).target/camera.node
# Add target alias
.PHONY: camera
camera: $(builddir)/camera.node

# Copy this to the executable output path.
$(builddir)/camera.node: TOOLSET := $(TOOLSET)
$(builddir)/camera.node: $(obj).target/camera.node FORCE_DO_CMD
	$(call do_cmd,copy)

all_deps += $(builddir)/camera.node
# Short alias for building this executable.
.PHONY: camera.node
camera.node: $(obj).target/camera.node $(builddir)/camera.node

# Add executable to "all" target.
.PHONY: all
all: $(builddir)/camera.node
