import { useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  QrCode,
  ScanLine,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import Button from "@/components/common/Button";

import {
  depositSettings,
  walletPaymentMethods,
} from "@/services/walletSettings";

import { createDepositRequest } from "@/services/walletService";

import { notifyAdminDepositRequest } from "@/services/notificationService";

export default function Deposit() {
  /* ============================================================
     DEFAULT DEPOSIT AMOUNTS
  ============================================================ */

  const presetAmounts = [5000, 10000, 50000, 100000];

  const defaultDepositAmount = presetAmounts.find(
    (value) =>
      value >= depositSettings.minimumDeposit &&
      value <= depositSettings.maximumDeposit,
  );

  /* ============================================================
     FORM STATE
  ============================================================ */

  const [amount, setAmount] = useState(
    defaultDepositAmount ? String(defaultDepositAmount) : "",
  );

  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);

  const [transactionNumber, setTransactionNumber] = useState("");

  const [note, setNote] = useState("");

  const [submitted, setSubmitted] = useState(false);

  const [error, setError] = useState("");

  /* ============================================================
     COPY STATE
  ============================================================ */

  const [copied, setCopied] = useState(false);

  /* ============================================================
     QR SCANNER STATE
  ============================================================ */

  const [scannerOpen, setScannerOpen] = useState(false);

  const [scanResult, setScanResult] = useState("");

  const [scanError, setScanError] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const streamRef = useRef<MediaStream | null>(null);

  const scanAnimationRef = useRef<number | null>(null);

  /* ============================================================
     PAYMENT METHODS
  ============================================================ */

  const paymentMethods = useMemo(() => {
    return walletPaymentMethods
      .filter(
        (method) =>
          method.enabled &&
          (method.type === "Deposit" || method.type === "Both") &&
          depositSettings.allowedPaymentMethods.includes(method.id),
      )
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, []);

  /* ============================================================
     SELECTED PAYMENT METHOD
  ============================================================ */

  const selectedMethod = paymentMethods.find(
    (method) => method.id === paymentMethodId,
  );

  /* ============================================================
     PAYMENT PHONE / ACCOUNT NUMBER
  ============================================================ */

  const paymentNumber =
    selectedMethod &&
    (
      selectedMethod as typeof selectedMethod & {
        phoneNumber?: string;
        accountNumber?: string;
        phone?: string;
      }
    ).phoneNumber
      ? (
          selectedMethod as typeof selectedMethod & {
            phoneNumber?: string;
          }
        ).phoneNumber
      : selectedMethod &&
          (
            selectedMethod as typeof selectedMethod & {
              accountNumber?: string;
            }
          ).accountNumber
        ? (
            selectedMethod as typeof selectedMethod & {
              accountNumber?: string;
            }
          ).accountNumber
        : selectedMethod &&
            (
              selectedMethod as typeof selectedMethod & {
                phone?: string;
              }
            ).phone
          ? (
              selectedMethod as typeof selectedMethod & {
                phone?: string;
              }
            ).phone
          : "";

  /* ============================================================
     COPY PAYMENT NUMBER
  ============================================================ */

  const handleCopyPaymentNumber = async () => {
    if (!paymentNumber) {
      return;
    }

    try {
      await navigator.clipboard.writeText(paymentNumber);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("Unable to copy the payment number.");
    }
  };

  /* ============================================================
     DOWNLOAD QR CODE
  ============================================================ */

  const handleDownloadQr = async () => {
    if (!selectedMethod?.qrCode) {
      return;
    }

    const fileName = `${selectedMethod.name
      .replace(/\s+/g, "-")
      .toLowerCase()}-qr`;

    try {
      const response = await fetch(selectedMethod.qrCode);

      if (!response.ok) {
        throw new Error("Unable to download QR code.");
      }

      const blob = await response.blob();

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `${fileName}.png`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch {
      const link = document.createElement("a");

      link.href = selectedMethod.qrCode;

      link.target = "_blank";

      link.rel = "noopener noreferrer";

      link.download = fileName;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);
    }
  };

  /* ============================================================
     STOP QR SCANNER
  ============================================================ */

  const stopQrScanner = () => {
    if (scanAnimationRef.current !== null) {
      cancelAnimationFrame(scanAnimationRef.current);

      scanAnimationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScannerOpen(false);
  };

  /* ============================================================
     START QR SCANNER
  ============================================================ */

  const startQrScanner = async () => {
    setScanError("");

    setScanResult("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError("Camera scanning is not supported by this browser.");

      setScannerOpen(true);

      return;
    }

    const BarcodeDetectorClass = (
      window as Window & {
        BarcodeDetector?: new (options?: { formats?: string[] }) => {
          detect: (
            source: ImageBitmapSource,
          ) => Promise<Array<{ rawValue?: string }>>;
        };
      }
    ).BarcodeDetector;

    if (!BarcodeDetectorClass) {
      setScanError(
        "QR scanning is not supported by this browser. Please use a supported Chrome or Edge browser.",
      );

      setScannerOpen(true);

      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment",
          },
        },
        audio: false,
      });

      streamRef.current = stream;

      setScannerOpen(true);

      window.setTimeout(() => {
        if (!videoRef.current) {
          return;
        }

        videoRef.current.srcObject = stream;

        videoRef.current
          .play()
          .then(() => {
            const detector = new BarcodeDetectorClass({
              formats: ["qr_code"],
            });

            const scan = async () => {
              if (!videoRef.current || !streamRef.current) {
                return;
              }

              try {
                const results = await detector.detect(videoRef.current);

                if (results.length > 0 && results[0].rawValue) {
                  const value = results[0].rawValue;

                  setScanResult(value);

                  stopQrScanner();

                  return;
                }
              } catch {
                // Continue scanning.
              }

              scanAnimationRef.current = requestAnimationFrame(scan);
            };

            scanAnimationRef.current = requestAnimationFrame(scan);
          })
          .catch(() => {
            setScanError("Unable to start the camera.");
          });
      }, 150);
    } catch (cameraError) {
      console.error(cameraError);

      setScannerOpen(true);

      setScanError(
        "Camera permission was denied or the camera is unavailable. Please allow camera access and try again.",
      );
    }
  };

  /* ============================================================
     SUBMIT
  ============================================================ */

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    setError("");

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError("Please enter a valid deposit amount.");

      return;
    }

    if (numericAmount < depositSettings.minimumDeposit) {
      setError(
        `Minimum deposit is ${depositSettings.minimumDeposit.toLocaleString()} MMK.`,
      );

      return;
    }

    if (numericAmount > depositSettings.maximumDeposit) {
      setError(
        `Maximum deposit is ${depositSettings.maximumDeposit.toLocaleString()} MMK.`,
      );

      return;
    }

    if (!paymentMethodId || !selectedMethod) {
      setError("Please select a payment method.");

      return;
    }

    if (!transactionNumber.trim()) {
      setError("Transaction number is required.");

      return;
    }

    if (!/^\d{6}$/.test(transactionNumber.trim())) {
      setError("Please enter the last 6 digits of your transaction number.");

      return;
    }

    const depositId = `DEP-${Date.now()}`;

    const request = createDepositRequest({
      id: depositId,

      playerId: "PLAYER-001",

      playerName: "Player",

      amount: numericAmount,

      paymentMethodId: selectedMethod.id,

      paymentMethodName: selectedMethod.name,

      transactionNumber: transactionNumber.trim(),

      note: note.trim() || undefined,

      status: "PENDING",

      createdAt: new Date().toISOString(),
    });

    notifyAdminDepositRequest({
      depositId: request.id,

      playerId: request.playerId,

      playerName: request.playerName,

      amount: request.amount,
    });

    setSubmitted(true);
  };

  /* ============================================================
     SUCCESS PAGE
  ============================================================ */

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={32} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Deposit Request Submitted
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Your deposit request has been submitted successfully.
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Processing time: {depositSettings.processingTime}
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/player/wallet"
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Back to Wallet
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     MAIN PAGE
  ============================================================ */

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* ========================================================
          HEADER
      ======================================================== */}

      <div>
        <Link
          to="/player/wallet"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Back to Wallet
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <ArrowDownToLine size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">Deposit</h1>

            <p className="mt-1 text-sm text-slate-500">
              Add money to your wallet.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          FORM
      ======================================================== */}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {/* ======================================================
            PAYMENT METHOD
        ====================================================== */}

        <div>
          <label className="mb-3 block text-sm font-semibold text-slate-700">
            Select Deposit Method
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            {paymentMethods.map((method) => {
              const selected = paymentMethodId === method.id;

              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => {
                    setPaymentMethodId(method.id);

                    setError("");

                    setCopied(false);

                    setScanResult("");
                  }}
                  className={`relative flex min-h-[92px] items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                    selected
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                      : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"
                  }`}
                >
                  {/* RADIO */}

                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      selected ? "border-indigo-600" : "border-slate-300"
                    }`}
                  >
                    {selected && (
                      <div className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                    )}
                  </div>

                  {/* LOGO */}

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    {method.logo ? (
                      <img
                        src={method.logo}
                        alt={`${method.name} logo`}
                        className="h-full w-full object-contain p-2"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <CreditCard className="h-7 w-7 text-slate-400" />
                    )}
                  </div>

                  {/* METHOD INFORMATION */}

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-bold ${
                        selected ? "text-indigo-700" : "text-slate-800"
                      }`}
                    >
                      {method.name}
                    </p>

                    {method.bankName && (
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {method.bankName}
                      </p>
                    )}

                    <p className="mt-1 text-xs text-slate-400">
                      {method.qrCode
                        ? "QR payment available"
                        : "Payment method"}
                    </p>
                  </div>

                  {/* SELECTED CHECK */}

                  {selected && (
                    <div className="absolute right-3 top-3">
                      <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* ========================================================
              SELECTED PAYMENT DETAILS
          ======================================================== */}

          {selectedMethod && (
            <div className="mt-4 overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50">
              {/* HEADER */}

              <div className="flex items-center gap-3 border-b border-indigo-100 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white">
                  {selectedMethod.logo ? (
                    <img
                      src={selectedMethod.logo}
                      alt={`${selectedMethod.name} logo`}
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <CreditCard className="h-5 w-5 text-indigo-500" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-bold text-indigo-800">
                    {selectedMethod.name}
                  </p>

                  <p className="text-xs text-indigo-600">
                    Send your payment using this method
                  </p>
                </div>
              </div>

              {/* ==================================================
                  PAYMENT NUMBER
              ================================================== */}

              {paymentNumber && (
                <div className="border-b border-indigo-100 px-4 py-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                    Payment Number
                  </p>

                  <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-white p-2 shadow-sm">
                    <div className="min-w-0 flex-1 px-2">
                      <p className="truncate text-base font-bold tracking-wide text-slate-800">
                        {paymentNumber}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyPaymentNumber}
                      className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        copied
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Send your payment to this number.
                  </p>
                </div>
              )}

              {/* ==================================================
                  QR CODE
              ================================================== */}

              {selectedMethod.qrCode && (
                <div className="flex flex-col items-center px-4 py-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <QrCode className="h-4 w-4 text-indigo-600" />
                    Payment QR Code
                  </div>

                  <div className="flex h-52 w-52 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <img
                      src={selectedMethod.qrCode}
                      alt={`${selectedMethod.name} payment QR code`}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  {/* QR ACTIONS */}

                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                    >
                      <Download className="h-4 w-4" />
                      Download QR
                    </button>

                    <button
                      type="button"
                      onClick={startQrScanner}
                      className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                      <ScanLine className="h-4 w-4" />
                      Scan QR
                    </button>
                  </div>

                  <p className="mt-3 text-center text-xs text-slate-500">
                    Scan the QR code to make your payment, or download it for
                    use on another device.
                  </p>
                </div>
              )}

              {/* ==================================================
                  SCANNED RESULT
              ================================================== */}

              {scanResult && (
                <div className="border-t border-indigo-100 px-4 py-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    QR Scan Result
                  </p>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="break-all text-sm font-medium text-emerald-800">
                      {scanResult}
                    </p>
                  </div>
                </div>
              )}

              {/* ==================================================
                  PAYMENT INSTRUCTION
              ================================================== */}

              <div className="border-t border-indigo-100 px-4 py-3">
                <p className="text-xs leading-5 text-slate-500">
                  After completing your payment, enter the last 6 digits of your
                  transaction number below.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            AMOUNT
        ======================================================== */}

        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Deposit Amount
          </label>

          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {presetAmounts
              .filter(
                (value) =>
                  value >= depositSettings.minimumDeposit &&
                  value <= depositSettings.maximumDeposit,
              )
              .map((value) => {
                const selected = amount === String(value);

                return (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 transition ${
                      selected
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="depositAmount"
                      value={value}
                      checked={selected}
                      onChange={() => setAmount(String(value))}
                      className="h-4 w-4 accent-indigo-600"
                    />

                    <span className="text-sm font-semibold">
                      {value.toLocaleString()}
                    </span>
                  </label>
                );
              })}
          </div>

          {/* CUSTOM AMOUNT */}

          <input
            type="number"
            min={depositSettings.minimumDeposit}
            max={depositSettings.maximumDeposit}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Enter custom amount"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />

          <p className="mt-2 text-xs text-slate-400">
            Min: {depositSettings.minimumDeposit.toLocaleString()} MMK · Max:{" "}
            {depositSettings.maximumDeposit.toLocaleString()} MMK
          </p>
        </div>

        {/* ========================================================
            TRANSACTION NUMBER
        ======================================================== */}

        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Transaction Number
          </label>

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={transactionNumber}
            onChange={(event) => {
              const value = event.target.value.replace(/\D/g, "").slice(0, 6);

              setTransactionNumber(value);
            }}
            placeholder="Enter last 6 digits"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />

          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Enter the last 6 digits of your transaction number.
            </p>

            <p className="text-xs font-medium text-slate-400">
              {transactionNumber.length}
              /6
            </p>
          </div>
        </div>

        {/* ========================================================
            NOTE
        ======================================================== */}

        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Note
            <span className="ml-1 font-normal text-slate-400">(Optional)</span>
          </label>

          <textarea
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Enter an optional note"
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* ========================================================
            DEPOSIT INFORMATION
        ======================================================== */}

        <div className="mt-6 rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700">
            Deposit Information
          </p>

          <p className="mt-1 text-sm leading-5 text-slate-500">
            {depositSettings.depositNote}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Processing time: {depositSettings.processingTime}
          </p>
        </div>

        {/* ========================================================
            ERROR
        ======================================================== */}

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {/* ========================================================
            SUBMIT
        ======================================================== */}

        <div className="mt-6 flex justify-end">
          <Button type="submit" variant="success">
            Submit Deposit Request
          </Button>
        </div>
      </form>

      {/* ==========================================================
          QR SCANNER MODAL
      ========================================================== */}

      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <ScanLine className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Scan QR Code
                  </h2>

                  <p className="text-xs text-slate-500">
                    Point your camera at a QR code
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={stopQrScanner}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* CAMERA */}

            <div className="relative aspect-square w-full overflow-hidden bg-slate-950">
              <video
                ref={videoRef}
                muted
                playsInline
                autoPlay
                className="h-full w-full object-cover"
              />

              {!scanError && (
                <>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="relative h-56 w-56 rounded-2xl border-2 border-white/80">
                      <span className="absolute left-0 top-0 h-6 w-6 border-l-4 border-t-4 border-indigo-400" />

                      <span className="absolute right-0 top-0 h-6 w-6 border-r-4 border-t-4 border-indigo-400" />

                      <span className="absolute bottom-0 left-0 h-6 w-6 border-b-4 border-l-4 border-indigo-400" />

                      <span className="absolute bottom-0 right-0 h-6 w-6 border-b-4 border-r-4 border-indigo-400" />
                    </div>
                  </div>

                  <div className="pointer-events-none absolute bottom-5 left-0 right-0 text-center">
                    <span className="rounded-full bg-black/60 px-4 py-2 text-xs font-medium text-white">
                      Position QR code inside the frame
                    </span>
                  </div>
                </>
              )}

              {scanError && (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div className="rounded-2xl bg-white p-5 text-center shadow-lg">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                      <QrCode className="h-6 w-6" />
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-800">
                      Unable to scan QR code
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {scanError}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}

            <div className="flex justify-end gap-2 px-5 py-4">
              <button
                type="button"
                onClick={stopQrScanner}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>

              {scanError && (
                <button
                  type="button"
                  onClick={() => {
                    stopQrScanner();

                    startQrScanner();
                  }}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
