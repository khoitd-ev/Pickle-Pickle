import SidebarNav from "../../components/layout/SidebarNav";

export default function OwnerCourtsPage() {
  return (
    <div className="flex">
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-4">Quản lý content</h1>
        <div className="bg-white rounded shadow p-6">
          <p>Quản lý các nội dung liên quan đến sân của bạn.</p>
          <ul className="mt-4 list-disc ml-6 text-gray-700">
            <li>Bài viết giới thiệu sân</li>
            <li>Hình ảnh sân</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
