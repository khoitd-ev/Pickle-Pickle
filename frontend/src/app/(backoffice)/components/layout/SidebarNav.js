"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useMemo, useEffect } from "react";

function NavItem({ href, icon, label, active, level = 0, collapsed }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-md transition-all ${
                active
                    ? "bg-sky-50 text-sky-600 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
            } ${level > 0 ? "pl-9" : ""}`}
        >
            {icon && (
                <Image
                    src={icon}
                    alt={label}
                    width={18}
                    height={18}
                    className="shrink-0"
                />
            )}

            {/* Ẩn label khi collapsed */}
            {!collapsed && <span className="truncate">{label}</span>}
        </Link>
    );
}

export default function SidebarNav() {
    const pathname = usePathname();

    const [collapsed, setCollapsed] = useState(false);
    const [adminReportOpen, setAdminReportOpen] = useState(
        pathname.startsWith("/admin/reports")
    );
    const [ownerReportOpen, setOwnerReportOpen] = useState(
        pathname.startsWith("/owner/reports")
    );

    const [mounted, setMounted] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const isAdmin = pathname.startsWith("/admin");
    const isOwner = pathname.startsWith("/owner"); // hiện chưa dùng nhưng giữ lại cho sau này

    // Chỉ chạy ở client: đọc trạng thái collapsed + user từ localStorage
    useEffect(() => {
        setMounted(true);

        try {
            const savedUser = localStorage.getItem("pp_user");
            if (savedUser) {
                setCurrentUser(JSON.parse(savedUser));
            }
        } catch {
            setCurrentUser(null);
        }

        const savedCollapsed = localStorage.getItem("pp_sidebar_collapsed");
        if (savedCollapsed === "true") {
            setCollapsed(true);
        }
    }, []);

    // Lưu lại trạng thái collapse
    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem("pp_sidebar_collapsed", collapsed ? "true" : "false");
    }, [collapsed, mounted]);

    const canManageAdmins =
        currentUser?.isAdminLeader || currentUser?.canManageAdmins;

    // ----- NAV CONFIG -----
    const adminNav = useMemo(() => {
        const baseNav = [
            {
                label: "Trang chủ",
                href: "/admin/dashboard",
                icon: "/backoffice/dashboardIcon.svg",
            },
            canManageAdmins && {
                label: "Quản lý admin",
                href: "/admin/admins",
                icon: "/backoffice/manageAdmin.svg",
            },
            {
                label: "Quản lý user",
                href: "/admin/users",
                icon: "/backoffice/manageUser.svg",
            },
            {
                label: "Quản lý tài chính",
                href: "/admin/finance",
                icon: "/backoffice/manageFinance.svg",
            },
            {
                label: "Quản lý đặt sân",
                href: "/admin/bookings",
                icon: "/backoffice/managecourtIcon.svg",
            },
            {
                label: "Quản lý sân & nhà cung cấp",
                href: "/admin/venues",
                icon: "/backoffice/manageaddonsIcon.svg",
            },
            {
                label: "Quản lý content",
                href: "/admin/content",
                icon: "/backoffice/managecontentIcon.svg",
            },
        ];

        return {
            main: baseNav.filter(Boolean),
            reports: {
                label: "Báo cáo & phân tích",
                icon: "/backoffice/reportIcon.svg",
                children: [
                    { label: "Doanh thu", href: "/admin/reports" },
                    { label: "Đặt sân", href: "/admin/reports/revenue" },
                    { label: "Khách hàng", href: "/admin/reports/customers" },
                ],
            },
            settings: {
                label: "Cài đặt",
                href: "/admin/settings",
                icon: "/backoffice/Setting.svg",
            },
        };
    }, [canManageAdmins]);

    const ownerNav = useMemo(
        () => ({
            main: [
                {
                    label: "Trang chủ",
                    href: "/owner/dashboard",
                    icon: "/backoffice/dashboardIcon.svg",
                },
                {
                    label: "Quản lý đặt sân",
                    href: "/owner/bookings",
                    icon: "/backoffice/managecourtIcon.svg",
                },
                {
                    label: "Quản lý dịch vụ",
                    href: "/owner/addons",
                    icon: "/backoffice/manageaddonsIcon.svg",
                },
                {
                    label: "Quản lý content",
                    href: "/owner/content",
                    icon: "/backoffice/managecontentIcon.svg",
                },
            ],
            reports: {
                label: "Báo cáo & phân tích",
                icon: "/backoffice/reportIcon.svg",
                children: [
                    { label: "Doanh thu", href: "/owner/reports" },
                    { label: "Đặt sân", href: "/owner/reports/revenue" },
                ],
            },
            settings: {
                label: "Cài đặt",
                href: "/owner/settings",
                icon: "/backoffice/Setting.svg",
            },
        }),
        []
    );

    const nav = isAdmin ? adminNav : ownerNav;

    const isActive = (href, { exact = false } = {}) => {
        if (exact) return pathname === href;
        return pathname === href || pathname.startsWith(href + "/");
    };

    // Quan trọng: chỉ render nav sau khi client mounted,
    // tránh chênh lệch HTML giữa server và client.
    if (!mounted) {
        return null;
    }

    return (
        <nav
            className={`relative flex flex-col h-full py-4 px-3 text-sm transition-all ${
                collapsed ? "w-[70px]" : "w-[240px]"
            }`}
        >
            {/* ===== NÚT COLLAPSE ===== */}
            <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                className="absolute w-4 h-10 rounded-full shadow bg-black border flex items-center justify-center text-xs text-white"
                style={{
                    top: "50%",
                    transform: "translateY(-50%)",
                    right: "-12px",
                    left: "auto",
                    zIndex: 50,
                }}
            >
                {collapsed ? "›" : "‹"}
            </button>

            {/* MAIN NAV */}
            <div className="space-y-1 mb-4">
                {nav.main.map((item) => (
                    <NavItem
                        key={item.href}
                        {...item}
                        active={isActive(item.href)}
                        collapsed={collapsed}
                    />
                ))}
            </div>

            {/* REPORTS */}
            <div className="mb-4">
                <button
                    type="button"
                    onClick={() =>
                        isAdmin
                            ? setAdminReportOpen((v) => !v)
                            : setOwnerReportOpen((v) => !v)
                    }
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-md transition-colors ${
                        pathname.startsWith(
                            isAdmin ? "/admin/reports" : "/owner/reports"
                        )
                            ? "bg-sky-50 text-sky-600 font-medium"
                            : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <Image
                            src={nav.reports.icon}
                            alt={nav.reports.label}
                            width={18}
                            height={18}
                        />
                        {!collapsed && <span>{nav.reports.label}</span>}
                    </div>

                    {!collapsed && (
                        <span className="text-xs text-gray-400">
                            {(isAdmin ? adminReportOpen : ownerReportOpen)
                                ? "▾"
                                : "▸"}
                        </span>
                    )}
                </button>

                {(isAdmin ? adminReportOpen : ownerReportOpen) && !collapsed && (
                    <div className="mt-1 space-y-1">
                        {nav.reports.children.map((child) => (
                            <NavItem
                                key={child.href}
                                href={child.href}
                                label={child.label}
                                active={isActive(child.href, { exact: true })}
                                level={1}
                                collapsed={collapsed}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* SETTINGS */}
            <div className="mt-auto pt-2 border-t border-gray-100">
                <NavItem
                    {...nav.settings}
                    active={isActive(nav.settings.href)}
                    collapsed={collapsed}
                />
            </div>
        </nav>
    );
}
