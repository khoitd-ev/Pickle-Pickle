"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

import BookingInfoSection from "../../../../components/courts/booking/BookingInfoSection";
import BookingInfoGuestSection from "../../../../components/courts/booking/BookingInfoGuestSection";
import AddonsSection from "../../../../components/courts/booking/AddonsSection";

// Fallback nếu chưa fetch được từ API
const FALLBACK_VENUE = {
    name: "PicklePickle Quận 1",
    address: "45 Lê Lợi, Quận 1, TP.HCM",
};


const USER_STORAGE_KEY = "pp_user";
const TOKEN_STORAGE_KEYS = ["pp_token"];
const PAYMENT_DRAFT_KEY = "pp_booking_payment_draft";


export default function CourtBookingAddonsPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const courtId = params?.courtId;
    const dateFromQuery = searchParams.get("date"); // "24/11/2025"
    const slotsRaw = searchParams.get("slots");     // "Sân 2-13:00,Sân 2-14:00,..."

    const [venueName, setVenueName] = useState(FALLBACK_VENUE.name);
    const [venueAddress, setVenueAddress] = useState(FALLBACK_VENUE.address);

    const [currentUser, setCurrentUser] = useState(null);
    const [isAuth, setIsAuth] = useState(false);
    const [loadingUser, setLoadingUser] = useState(true);

    const [guestInfo, setGuestInfo] = useState({
        name: "",
        email: "",
        phone: "",
    });

    const [addonsSummary, setAddonsSummary] = useState({
        items: [],
        addonsTotal: 0,
    });

    /* ===================== LẤY THÔNG TIN SÂN ===================== */
    useEffect(() => {
        if (!courtId) return;

        let cancelled = false;

        (async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE}/venues/${courtId}/detail`
                );
                if (!res.ok) return;

                const json = await res.json();
                const court = json.data?.court || json.data;

                if (!court || cancelled) return;

                setVenueName(court.name || FALLBACK_VENUE.name);
                setVenueAddress(court.address || FALLBACK_VENUE.address);
            } catch (err) {
                console.error("fetch venue detail error", err);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [courtId]);

    /* ===================== CHECK LOGIN TỪ LOCALSTORAGE ===================== */
    useEffect(() => {
        if (typeof window === "undefined") return;

        let parsedUser = null;

        // 1. Lấy user từ pp_user
        const rawUser = localStorage.getItem(USER_STORAGE_KEY);
        if (rawUser) {
            try {
                parsedUser = JSON.parse(rawUser);
            } catch (err) {
                console.error("Cannot parse pp_user", err);
            }
        }

        // 2. Kiểm tra có token pp_token không
        let hasToken = false;
        for (const key of TOKEN_STORAGE_KEYS) {
            if (localStorage.getItem(key)) {
                hasToken = true;
                break;
            }
        }

        if (parsedUser || hasToken) {
            setIsAuth(true);
            setCurrentUser(parsedUser || {});

            // Prefill luôn form guest nếu có sẵn thông tin
            setGuestInfo((prev) => ({
                ...prev,
                name:
                    parsedUser?.fullName ||
                    parsedUser?.name ||
                    parsedUser?.username ||
                    prev.name,
                email: parsedUser?.email || prev.email,
                phone:
                    parsedUser?.phone ||
                    parsedUser?.phoneNumber ||
                    parsedUser?.mobile ||
                    prev.phone,
            }));
        } else {
            setIsAuth(false);
            setCurrentUser(null);
        }

        setLoadingUser(false);
    }, []);

    /* ===================== BUILD BẢNG GIÁ & TỔNG TIỀN ===================== */
    const { pricingDetails, totalCourtPrice } = buildPricingDetails(slotsRaw);

    const handleEdit = () => {
        router.push(`/courts/${courtId}/booking`);
    };

    const displayDate = dateFromQuery || new Date().toLocaleDateString("vi-VN");

    // Props dùng chung cho 2 phiên bản BookingInfo
    const bookingInfoCommon = {
        courtName: venueName,
        courtAddress: venueAddress,
        phoneNumber:
            currentUser?.phone ||
            currentUser?.phoneNumber ||
            guestInfo.phone ||
            "",
        date: displayDate,
        pricingDetails,
        totalCourtPrice,
        onEdit: handleEdit,
    };

    const handleGuestInfoChange = (next) => setGuestInfo(next);

    const handleContinue = () => {
        if (typeof window === "undefined") return;

        const raw = localStorage.getItem(PAYMENT_DRAFT_KEY);
        if (!raw) {
            alert("Không tìm thấy thông tin booking. Vui lòng đặt sân lại.");
            router.push(`/courts/${courtId}/booking`);
            return;
        }

        let existingDraft;
        try {
            existingDraft = JSON.parse(raw);
        } catch (err) {
            console.error("Cannot parse payment draft", err);
            alert("Thông tin đặt sân bị lỗi. Vui lòng đặt lại sân.");
            localStorage.removeItem(PAYMENT_DRAFT_KEY);
            router.push(`/courts/${courtId}/booking`);
            return;
        }

        if (!existingDraft.bookingId) {
            alert("Không tìm thấy bookingId. Vui lòng đặt lại sân.");
            router.push(`/courts/${courtId}/booking`);
            return;
        }

        // Gộp thông tin khách hàng cho bước payment/invoice
        const customer =
            isAuth && currentUser
                ? {
                    type: "user",
                    name:
                        currentUser.fullName ||
                        currentUser.name ||
                        currentUser.username ||
                        currentUser.email ||
                        "Khách hàng",
                    email: currentUser.email || "",
                    phone:
                        currentUser.phone ||
                        currentUser.phoneNumber ||
                        currentUser.mobile ||
                        "",
                }
                : {
                    type: "guest",
                    name: guestInfo.name,
                    email: guestInfo.email,
                    phone: guestInfo.phone,
                };

        const updatedDraft = {
            ...existingDraft, // GIỮ bookingId, courtTotal cũ nếu có
            courtId,
            date: displayDate,
            courtName: venueName,
            courtAddress: venueAddress,
            courtPricingDetails: pricingDetails,
            courtTotal: totalCourtPrice,
            addons: addonsSummary,
            customer,
        };

        localStorage.setItem(PAYMENT_DRAFT_KEY, JSON.stringify(updatedDraft));
        router.push(`/courts/${courtId}/booking/payment`);
    };



    return (
        <main className="min-h-screen bg-white">
            <section className="mx-auto max-w-6xl px-4 py-10 space-y-10">
                {/* SECTION 1: Info + chi tiết giá */}
                {loadingUser ? (
                    <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-6 md:px-10 md:py-8">
                        <p className="text-sm text-zinc-500">
                            Đang tải thông tin khách hàng...
                        </p>
                    </div>
                ) : isAuth && currentUser ? (
                    <BookingInfoSection
                        user={{
                            name:
                                currentUser.fullName ||
                                currentUser.name ||
                                currentUser.username ||
                                currentUser.email ||
                                "Khách hàng",
                            email: currentUser.email || "",
                            avatarUrl:
                                currentUser.avatarUrl ||
                                currentUser.avatar ||
                                "/courts/Logo.svg",
                        }}
                        {...bookingInfoCommon}
                    />
                ) : (
                    <BookingInfoGuestSection
                        guestInfo={guestInfo}
                        onChangeGuestInfo={handleGuestInfoChange}
                        {...bookingInfoCommon}
                    />
                )}

                {/* SECTION 2: Dịch vụ thêm */}
                <AddonsSection venueId={courtId} onChange={setAddonsSummary} />

                {/* Nút tiếp tục */}
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleContinue}
                        className="mt-4 rounded-md bg-black px-8 py-2.5 text-sm md:text-base font-semibold text-white shadow-sm hover:bg-zinc-800"
                    >
                        Tiếp tục
                    </button>
                </div>
            </section>
        </main>
    );
}

/* ===================== Helpers: slots -> rows & total ===================== */

function buildPricingDetails(slotsRaw) {
    if (!slotsRaw) {
        return { pricingDetails: [], totalCourtPrice: 0 };
    }

    const items = slotsRaw
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
            const [courtLabel, timeStr] = part.split("-");
            const hour = parseInt(timeStr.slice(0, 2), 10);
            return { courtLabel, hour };
        });

    if (!items.length) {
        return { pricingDetails: [], totalCourtPrice: 0 };
    }

    const byCourt = {};
    for (const item of items) {
        if (!byCourt[item.courtLabel]) byCourt[item.courtLabel] = [];
        byCourt[item.courtLabel].push(item.hour);
    }

    const pricingDetails = [];
    let totalCourtPrice = 0;

    const pad = (h) => h.toString().padStart(2, "0") + ":00";

    Object.entries(byCourt).forEach(([courtLabel, hoursArr]) => {
        const sorted = [...hoursArr].sort((a, b) => a - b);

        let start = sorted[0];
        let prev = sorted[0];

        const flushSegment = (segmentStart, segmentEnd) => {
            const hoursCount = segmentEnd - segmentStart + 1;
            const pricePerHour = getPriceForHour(segmentStart);
            const totalPrice = pricePerHour * hoursCount;
            totalCourtPrice += totalPrice;

            pricingDetails.push({
                id: `${courtLabel}-${segmentStart}`,
                courtLabel,
                timeRange: `${pad(segmentStart)} - ${pad(segmentEnd + 1)}`,
                totalPrice,
            });
        };

        for (let i = 1; i < sorted.length; i++) {
            const h = sorted[i];
            if (h === prev + 1) {
                prev = h;
            } else {
                flushSegment(start, prev);
                start = h;
                prev = h;
            }
        }
        flushSegment(start, prev);
    });

    return { pricingDetails, totalCourtPrice };
}

function getPriceForHour(hour) {
    if (hour >= 5 && hour < 9) return 100000;
    if (hour >= 9 && hour < 16) return 120000;
    if (hour >= 16 && hour < 23) return 150000;
    return 120000;
}


