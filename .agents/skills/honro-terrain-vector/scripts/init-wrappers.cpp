// Initialize standard C++ object wrappers omitted by Inkscape 1.4 headless startup.
// No tracing algorithm is changed; native Inkscape object-trace is still used.
namespace Glib { void init(); }
namespace Gdk { void wrap_init(); }
namespace Pango { void wrap_init(); }
namespace Gtk { void wrap_init(); }
__attribute__((constructor)) static void init_wrappers() { Glib::init(); Gdk::wrap_init(); Pango::wrap_init(); Gtk::wrap_init(); }
