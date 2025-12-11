// frontend/src/app/(backoffice)/layout.js
import SidebarNav from "./components/layout/SidebarNav";

export default function BackofficeLayout({ children }) {
  return (

    <div className="flex flex-1 min-h-0 bg-[#F5F7FB]">
      {/* Sidebar cố định bên trái */}
      <SidebarNav />


      <main className="flex-1 min-w-0 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
