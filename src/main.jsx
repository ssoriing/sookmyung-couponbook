import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Camera,
  Check,
  ChevronRight,
  MapPin,
  QrCode,
  Ticket,
  UserRound,
  X,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

import {
  MapContainer,
  TileLayer,
  Marker,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import L from "leaflet";

import "./styles.css";


// =========================
// 제휴 매장
// =========================

const STORES = [
  {
    id: "forime",
    name: "포라임",
    benefit: "고구마롤 2p 무료 제공",
    lat: 37.5451450224107,
    lng: 126.965944034218,
    qrCode: "S2026-FORAIM",
  },
  {
    id: "tanghwa",
    name: "탕화쿵푸",
    benefit: "마라샹궈 10% 할인",
    lat: 37.545100044634005,
    lng: 126.96619526479479,
    qrCode: "S2026-TANGHWA",
  },
  {
    id: "bonsole",
    name: "본솔커피",
    benefit: "아메리카노 사이즈업",
    lat: 37.54486045856569,
    lng: 126.96647487162782,
    qrCode: "S2026-BONSOLE",
  },
];


// =========================
// Leaflet 마커 아이콘
// =========================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


// =========================
// 쿠폰 데이터
// =========================

const SEED_COUPONS = STORES.map((store) => ({
  id: `coupon-${store.id}`,
  storeId: store.id,
  benefit: store.benefit,
  used: false,
}));


function getCoupons(studentId) {
  const key = `sookmyung-coupons-${studentId}`;

  const saved = localStorage.getItem(key);

  if (saved) {
    return JSON.parse(saved);
  }

  localStorage.setItem(
    key,
    JSON.stringify(SEED_COUPONS)
  );

  return SEED_COUPONS;
}


function saveCoupons(studentId, coupons) {
  localStorage.setItem(
    `sookmyung-coupons-${studentId}`,
    JSON.stringify(coupons)
  );
}


// =========================
// App
// =========================

function App() {
  const [studentId, setStudentId] = useState(
    localStorage.getItem("sookmyung-student-id") || ""
  );

  const [studentName, setStudentName] = useState(
    localStorage.getItem("sookmyung-student-name") || ""
  );

  const [enteredId, setEnteredId] = useState("");
  const [enteredName, setEnteredName] = useState("");

  const [tab, setTab] = useState("map");
  const [selectedStore, setSelectedStore] = useState(null);

  const [coupons, setCoupons] = useState(() =>
    studentId ? getCoupons(studentId) : []
  );

  const [scanResult, setScanResult] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);


  // =========================
  // 학번 변경
  // =========================

  useEffect(() => {
    if (studentId) {
      setCoupons(getCoupons(studentId));
    }
  }, [studentId]);


  // =========================
  // 모달 / 스캐너 열림 상태
  // =========================

  useEffect(() => {
    const overlayOpen =
      Boolean(selectedStore) ||
      Boolean(scanResult) ||
      scannerOpen;

    if (overlayOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [selectedStore, scanResult, scannerOpen]);


  // =========================
  // 로그인
  // =========================

function enterStudentId(e) {
  e.preventDefault();

  const id = enteredId.trim();
  const name = enteredName.trim();

  if (!name) {
    alert("이름을 입력해주세요.(예: 김솔)");
    return;
  }

  if (!id) {
    alert("학번을 입력해주세요.(예: 2413252)");
    return;
  }

  localStorage.setItem(
    "sookmyung-student-id",
    id
  );

  localStorage.setItem(
    "sookmyung-student-name",
    name
  );

  setStudentId(id);
  setStudentName(name);
  setCoupons(getCoupons(id));
}

  // =========================
  // 로그아웃
  // =========================

  function logout() {
    localStorage.removeItem(
      "sookmyung-student-id"
    );

    localStorage.removeItem(
      "sookmyung-student-name"
    );

    setStudentId("");
    setStudentName("");
    setEnteredId("");
    setEnteredName("");
    setTab("map");
  }


  // =========================
  // 쿠폰 사용
  // =========================

  function useCouponByStore(store) {
    const coupon = coupons.find(
      (c) =>
        c.storeId === store.id &&
        !c.used
    );

    if (!coupon) {
      alert("사용 가능한 쿠폰이 없습니다.");
      return;
    }

    setScanResult({
      store,
      coupon,
    });
  }


  // =========================
  // 쿠폰 사용 확정
  // =========================

  function confirmUse() {
    if (!scanResult) return;

    const next = coupons.map((c) =>
      c.id === scanResult.coupon.id
        ? {
            ...c,
            used: true,
          }
        : c
    );

    setCoupons(next);

    saveCoupons(
      studentId,
      next
    );

    setScanResult({
      ...scanResult,
      completed: true,
    });
  }


  // =========================
  // QR 스캔
  // =========================

  function handleScan(code) {
    const store = STORES.find(
      (s) =>
        s.qrCode.toLowerCase() ===
        code.trim().toLowerCase()
    );

    if (!store) {
      alert("등록되지 않은 매장 QR입니다.");
      return;
    }

    setScannerOpen(false);

    const coupon = coupons.find(
      (c) =>
        c.storeId === store.id &&
        !c.used
    );

    if (!coupon) {
      alert(
        "이 매장의 사용 가능한 쿠폰이 없습니다."
      );
      return;
    }

    setScanResult({
      store,
      coupon,
    });
  }


  // =========================
  // 로그인 화면
  // =========================

  if (!studentId) {
    return (
      <div className="login-page">

        <div className="login-card">

          <div className="logo-mark">
            <Ticket size={30} />
          </div>

          <p className="eyebrow">
            SOOKMYUNG UNIVERSITY
          </p>

          <h1>
            숙명여대
            <br />
            <span>쿠폰북</span>
          </h1>

          <p className="login-copy">
            학생회 제휴 혜택을 한곳에서
            <br />
            간편하게 확인하고 사용하세요.
          </p>

          <form onSubmit={enterStudentId}>

            <label htmlFor="studentName">
              이름
            </label>

            <input
              id="studentName"
              type="text"
              placeholder="이름을 입력해주세요(예: 김솔)"
              value={enteredName}
              onChange={(e) =>
                setEnteredName(e.target.value)
              }
            />

            <label htmlFor="studentId">
              학번
            </label>

            <input
              id="studentId"
              inputMode="numeric"
              placeholder="학번을 입력해주세요(예: 2413252)"
              value={enteredId}
              onChange={(e) =>
                setEnteredId(e.target.value)
              }
            />

            <button
              className="primary-btn"
              type="submit"
            >
              쿠폰북 시작하기
              <ChevronRight size={18} />
            </button>

          </form>

          <p className="privacy-note">
            입력한 이름과 학번은 이 기기에서
            쿠폰함을 구분하기 위해 사용됩니다.
          </p>

        </div>

      </div>
    );
  }


  // =========================
  // 메인 화면
  // =========================

  return (
    <div className="app-shell">

      {/* 상단 */}

      <header className="topbar">

        <div>

          <p className="eyebrow">
            SOOKMYUNG UNIVERSITY
          </p>

          <h1>
            숙명여대 쿠폰북
          </h1>

        </div>


        {/* 사용자 정보 */}

<div className="user-area">

  <button
    className="profile-avatar"
    onClick={() => setProfileOpen((prev) => !prev)}
    aria-label="내 정보"
  >
    <UserRound size={19} />
  </button>

  {profileOpen && (
    <div className="profile-popover">

      <div className="profile-popover-header">
        <div className="profile-popover-avatar">
          <UserRound size={20} />
        </div>

        <div>
          <strong>{studentName}</strong>
          <span>{studentId}</span>
        </div>
      </div>

      <div className="profile-divider" />

      <button
        className="profile-logout"
        onClick={logout}
      >
       계정 설정
      </button>

    </div>
  )}

</div>

      </header>


      {/* 콘텐츠 */}

      <main className="content">

        {tab === "map" && (
          <MapScreen
            onStoreClick={setSelectedStore}
          />
        )}

        {tab === "coupons" && (
          <CouponScreen
            coupons={coupons}
            onUse={useCouponByStore}
          />
        )}

        {tab === "scan" && (
          <ScanScreen
            onOpenScanner={() =>
              setScannerOpen(true)
            }
            onDemoScan={handleScan}
          />
        )}

      </main>


      {/* 하단 메뉴 */}

      <nav className="bottom-nav">

        <NavButton
          active={tab === "map"}
          onClick={() => setTab("map")}
          icon={<MapPin size={22} />}
          label="지도"
        />

        <NavButton
          active={tab === "coupons"}
          onClick={() => setTab("coupons")}
          icon={<Ticket size={22} />}
          label="내 쿠폰함"
        />

        <NavButton
          active={tab === "scan"}
          onClick={() => setTab("scan")}
          icon={<QrCode size={22} />}
          label="QR 스캔"
        />

      </nav>


      {/* 매장 모달 */}

      {selectedStore && (
        <StoreModal
          store={selectedStore}

          hasCoupon={coupons.some(
            (c) =>
              c.storeId === selectedStore.id &&
              !c.used
          )}

          onClose={() =>
            setSelectedStore(null)
          }

          onUse={() => {
            setSelectedStore(null);
            setTab("scan");
          }}
        />
      )}


      {/* 쿠폰 확인 모달 */}

      {scanResult && (
        <ConfirmModal
          result={scanResult}
          onCancel={() =>
            setScanResult(null)
          }
          onConfirm={confirmUse}
        />
      )}


      {/* QR 스캐너 */}

      {scannerOpen && (
        <ScannerModal
          onClose={() =>
            setScannerOpen(false)
          }
          onScan={handleScan}
        />
      )}

    </div>
  );
}


// =========================
// 하단 메뉴 버튼
// =========================

function NavButton({
  active,
  onClick,
  icon,
  label,
}) {
  return (
    <button
      className={`nav-item ${
        active ? "active" : ""
      }`}
      onClick={onClick}
    >
      {icon}

      <span>
        {label}
      </span>
    </button>
  );
}


// =========================
// 지도
// =========================

function MapScreen({ onStoreClick }) {

  // 매장들 좌표 평균으로 맵 포커스
const center = [
  STORES.reduce((sum, store) => sum + store.lat, 0) / STORES.length,
  STORES.reduce((sum, store) => sum + store.lng, 0) / STORES.length,
];

  return (
    <section>

      <div className="section-heading">

        <div>

          <p className="eyebrow">
            COUPON MAP
          </p>

          <h2>
            숙명여대 주변 제휴 매장
          </h2>

        </div>

        <span className="count-badge">
          {STORES.length}곳
        </span>

      </div>


      <div className="map-card">

        <MapContainer
          center={center}
          zoom={18}
          scrollWheelZoom={true}
          zoomControl={true}
          style={{
            width: "100%",
            height: "500px",
            borderRadius: "20px",
          }}
        >

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />


          {STORES.map((store) => (

            <Marker
              key={store.id}
              position={[
                store.lat,
                store.lng,
              ]}
              eventHandlers={{
                click: () => onStoreClick(store),
              }}
            />

          ))}

        </MapContainer>

      </div>


      <p className="map-help">
        마커를 눌러 매장 혜택을 확인해보세요.
      </p>

    </section>
  );
}


// =========================
// 쿠폰 화면
// =========================

function CouponScreen({
  coupons,
  onUse,
}) {

  const active = coupons.filter(
    (c) => !c.used
  );

  return (
    <section>

      <div className="section-heading">

        <div>

          <p className="eyebrow">
            MY COUPONS
          </p>

          <h2>
            내 쿠폰함
          </h2>

        </div>

        <span className="count-badge">
          {active.length}장
        </span>

      </div>


      {active.length === 0 ? (

        <div className="empty-state">

          <Ticket size={36} />

          <h3>
            사용 가능한 쿠폰이 없어요
          </h3>

          <p>
            새로운 제휴 혜택을 확인해보세요.
          </p>

        </div>

      ) : (

        <div className="coupon-list">

          {active.map((coupon) => {

            const store = STORES.find(
              (s) =>
                s.id === coupon.storeId
            );

            return (

              <article
                className="coupon-card"
                key={coupon.id}
              >

                <div className="coupon-top">

                  <div className="store-icon">
                    <Ticket size={22} />
                  </div>

                  <div>

                    <p className="coupon-store">
                      {store.name}
                    </p>

                    <h3>
                      {coupon.benefit}
                    </h3>

                  </div>

                </div>


                <div className="coupon-divider" />


                <button
                  className="coupon-use-btn"
                  onClick={() =>
                    onUse(store)
                  }
                >

                  <QrCode size={18} />

                  QR 스캔해서 사용

                </button>

              </article>

            );

          })}

        </div>

      )}

    </section>
  );
}


// =========================
// QR 화면
// =========================

function ScanScreen({
  onOpenScanner,
  onDemoScan,
}) {

  const [code, setCode] = useState("");

  return (
    <section className="scan-page">

      <div className="section-heading">

        <div>

          <p className="eyebrow">
            USE COUPON
          </p>

          <h2>
            쿠폰 사용하기
          </h2>

        </div>

      </div>


      <div className="scan-card">

        <div className="scan-illustration">

          <QrCode
            size={62}
            strokeWidth={1.6}
          />

        </div>


        <h3>
          매장 QR을 스캔해주세요
        </h3>


        <p>
          매장에 부착된 QR 코드를 스캔하면
          <br />
          사용 가능한 쿠폰을 확인할 수 있어요.
        </p>


        <button
          className="primary-btn wide"
          onClick={onOpenScanner}
        >

          <Camera size={19} />

          카메라로 QR 스캔

        </button>

      </div>


      <div className="fallback-card">

        <p className="eyebrow">
          CAMERA FALLBACK
        </p>


        <h3>
          카메라를 사용할 수 없나요?
        </h3>


        <p>
          매장 코드를 직접 입력할 수 있습니다.
        </p>


        <div className="code-row">

          <input
            value={code}
            onChange={(e) =>
              setCode(e.target.value)
            }
            placeholder="예: S2026-FORAIM"
          />


          <button
            onClick={() =>
              onDemoScan(code)
            }
          >
            확인
          </button>

        </div>


        <small>
          테스트용 코드:
          S2026-FORAIM /
          S2026-TANGHWA
        </small>

      </div>

    </section>
  );
}


// =========================
// 매장 모달
// =========================

function StoreModal({
  store,
  hasCoupon,
  onClose,
  onUse,
}) {
  return (
    <div
      className="modal-backdrop store-modal-layer"
      onClick={onClose}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <div className="store-icon large">
          <MapPin size={24} />
        </div>

        <p className="eyebrow">
          PARTNER STORE
        </p>

        <h2>
          {store.name}
        </h2>

        <div className="benefit-box">
          <span>
            COUPON
          </span>

          <strong>
            {store.benefit}
          </strong>
        </div>

        <button
          className="primary-btn wide"
          disabled={!hasCoupon}
          onClick={onUse}
        >
          {hasCoupon
            ? "QR 코드 스캔해서 쿠폰 사용하기"
            : "사용 가능한 쿠폰 없음"}
        </button>
      </div>
    </div>
  );
}


// =========================
// 쿠폰 확인 모달
// =========================

function ConfirmModal({
  result,
  onCancel,
  onConfirm,
}) {

  if (result.completed) {

    return (
      <div
        className="modal-backdrop"
        onClick={onCancel}
      >

        <div
          className="modal-card success"
          onClick={(e) =>
            e.stopPropagation()
          }
        >

          <div className="success-icon">
            <Check size={34} />
          </div>


          <p className="eyebrow">
            COUPON USED
          </p>


          <h2>
            쿠폰 사용 완료!
          </h2>


          <p>

            {result.store.name}의
            <br />

            <strong>
              {result.coupon.benefit}
            </strong>

            혜택이 사용 처리되었습니다.

          </p>


          <button
            className="primary-btn wide"
            onClick={onCancel}
          >
            확인
          </button>

        </div>

      </div>
    );
  }


  return (
    <div
      className="modal-backdrop"
      onClick={onCancel}
    >

      <div
        className="modal-card"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <button
          className="modal-close"
          onClick={onCancel}
        >
          <X size={20} />
        </button>


        <div className="store-icon large">
          <Ticket size={24} />
        </div>


        <p className="eyebrow">
          COUPON CONFIRM
        </p>


        <h2>
          이 쿠폰을
          <br />
          사용하시겠습니까?
        </h2>


        <div className="benefit-box">

          <span>
            {result.store.name}
          </span>

          <strong>
            {result.coupon.benefit}
          </strong>

        </div>


        <div className="modal-actions">

          <button
            className="secondary-btn"
            onClick={onCancel}
          >
            아니요
          </button>


          <button
            className="primary-btn"
            onClick={onConfirm}
          >
            네, 사용할게요
          </button>

        </div>

      </div>

    </div>
  );
}


// =========================
// QR 스캐너
// =========================

function ScannerModal({
  onClose,
  onScan,
}) {
  const regionId = "qr-reader";

  const [error, setError] = useState("");

  const scannerRef = React.useRef(null);
  const activeRef = React.useRef(true);
  const closingRef = React.useRef(false);

  useEffect(() => {
    activeRef.current = true;
    closingRef.current = false;

    const scanner = new Html5Qrcode(regionId);

    scannerRef.current = scanner;

    async function startScanner() {
      try {
        await scanner.start(
          {
            facingMode: "environment",
          },
          {
            fps: 10,
            qrbox: {
              width: 230,
              height: 230,
            },
          },
          async (decodedText) => {
            if (
              !activeRef.current ||
              closingRef.current
            ) {
              return;
            }

            activeRef.current = false;

            try {
              await scanner.stop();
            } catch (e) {
              console.log("카메라 종료:", e);
            }

            onScan(decodedText);
          },
          () => {}
        );
      } catch (e) {
        console.error(e);

        if (activeRef.current) {
          setError(
            "카메라 권한을 허용하거나, 매장 코드를 직접 입력해주세요."
          );
        }
      }
    }

    startScanner();

    return () => {
      activeRef.current = false;

      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current
              ?.clear()
              .catch(() => {});
          });
      }
    };
  }, [onScan]);

  async function closeScanner() {
    if (closingRef.current) {
      return;
    }

    closingRef.current = true;
    activeRef.current = false;

    const scanner = scannerRef.current;

    if (scanner) {
      try {
        await scanner.stop();
      } catch (e) {
        console.log("카메라 종료:", e);
      }

      try {
        scanner.clear();
      } catch (e) {
        console.log("스캐너 정리:", e);
      }
    }

    scannerRef.current = null;

    onClose();
  }

  return (
    <div className="scanner-overlay">
      <div className="scanner-header">
        <div>
          <p className="eyebrow">
            QR SCANNER
          </p>

          <h2>
            매장 QR 스캔
          </h2>
        </div>

        <button
          className="icon-btn light"
          onClick={closeScanner}
        >
          <X size={22} />
        </button>
      </div>

      <div className="scanner-box">
        <div id={regionId} />

        {!error && (
          <div className="scan-frame" />
        )}
      </div>

      {error && (
        <p className="scanner-error">
          {error}
        </p>
      )}

      <p className="scanner-tip">
        QR 코드를 화면 중앙의 사각형 안에 맞춰주세요.
      </p>

      <button
        className="secondary-btn light-btn"
        onClick={closeScanner}
      >
        닫기
      </button>
    </div>
  );
}


// =========================
// React 시작
// =========================

createRoot(
  document.getElementById("root")
).render(
  <App />
);