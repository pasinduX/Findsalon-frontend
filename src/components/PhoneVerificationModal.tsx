"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/auth.service";

type Step = "phone" | "otp";

export function PhoneVerificationModal() {
  const { user, phoneVerified, onPhoneVerified } = useAuth();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const open = !!user && !phoneVerified;

  const handleSendOtp = async () => {
    if (!user) return;
    setError("");
    if (!phone.trim()) {
      setError("Please enter your phone number");
      return;
    }
    setLoading(true);
    try {
      const res = await authService.sendPhoneOtp(user.id, phone.trim());
      const raw = (res.data as any)?.data ?? res.data;
      if (res.error) {
        setError((res.error as string) || "Failed to send code");
        return;
      }
      if (raw?.dev_otp) {
        setDevOtp(raw.dev_otp as string);
      }
      setStep("otp");
    } catch {
      setError("Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!user) return;
    setError("");
    if (otp.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const { data, error: verifyError } = await authService.verifyPhoneOtp(user.id, otp);
      if (verifyError || !data) {
        setError(verifyError || "Invalid code. Please try again.");
        return;
      }
      onPhoneVerified(data);
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setStep("phone");
    setOtp("");
    setError("");
    setDevOtp(null);
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md [&>button:last-child]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Verify Your WhatsApp Number
          </DialogTitle>
          <DialogDescription>
            {step === "phone"
              ? "Add your phone number to receive booking confirmations and updates via WhatsApp."
              : `We sent a 6-digit code to ${phone} on WhatsApp. Enter it below.`}
          </DialogDescription>
        </DialogHeader>

        {step === "phone" ? (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+94 71 234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g. +94 for Sri Lanka)
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              className="w-full"
              onClick={handleSendOtp}
              disabled={loading}
            >
              {loading ? "Sending…" : "Send Verification Code"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-3">
              <Label>Enter 6-digit code</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  disabled={loading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {devOtp && (
                <p className="text-xs text-center text-amber-600 bg-amber-50 rounded px-3 py-1.5">
                  Dev mode — code: <strong>{devOtp}</strong>
                </p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              className="w-full"
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying…" : "Verify"}
            </Button>

            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={handleResend}
              disabled={loading}
            >
              Change number or resend code
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
