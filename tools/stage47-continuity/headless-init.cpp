#include <initializer_list>
#include <dlfcn.h>
// Initialize C++ object wrappers which Inkscape CLI 1.4 omits without GUI.
// Does not alter Inkscape, tracing algorithms, input pixels or files.
__attribute__((constructor)) static void init(){
 for(const char* symbol : {"_ZN4Glib4initEv", "_ZN3Gdk9wrap_initEv", "_ZN3Gtk9wrap_initEv"}){
  auto fn = reinterpret_cast<void(*)()>(dlsym(RTLD_DEFAULT,symbol)); if(fn)fn();
 }
}
