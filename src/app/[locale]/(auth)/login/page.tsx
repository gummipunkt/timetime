"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Loader2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "de";
  const t = useTranslations();

  const callbackUrl = searchParams.get("callbackUrl") || `/${locale}/dashboard`;
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(
    error === "CredentialsSignin" ? t("auth.invalidCredentials") : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setLoginError(result.error);
        setIsLoading(false);
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setLoginError(t("errors.unknown"));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5MzMzZWEiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0YzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-60" />

      {/* Decorative blurs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-300/30 rounded-full filter blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300/30 rounded-full filter blur-3xl" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-fuchsia-300/20 rounded-full filter blur-3xl" />

      <Card className="relative z-10 w-full max-w-md bg-white/80 border-purple-100 backdrop-blur-xl shadow-2xl shadow-purple-200/50">
        <CardHeader className="text-center pb-2">
          <Link href={`/${locale}`} className="inline-flex items-center justify-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-300/50">
              <Clock className="w-7 h-7 text-white" />
            </div>
          </Link>
          <CardTitle className="text-2xl font-bold text-gray-800">{t("auth.welcomeBack")}</CardTitle>
          <CardDescription className="text-gray-500">{t("auth.signInToContinue")}</CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {loginError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">
                {t("auth.email")}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@firma.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="bg-white border-purple-200 text-gray-800 placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">
                {t("auth.password")}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-white border-purple-200 text-gray-800 placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-200"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-medium py-5 shadow-lg shadow-purple-300/30"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("auth.signingIn")}
                </>
              ) : (
                t("auth.signIn")
              )}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 rounded-lg bg-purple-50 border border-purple-100 max-h-64 overflow-y-auto">
            <p className="text-xs text-purple-600 uppercase tracking-wider mb-3 font-medium">
              Demo Zugangsdaten (nach npm run db:seed)
            </p>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-purple-700 text-xs">Management & HR</span>
                <div className="mt-1 space-y-1">
                  <code className="text-purple-700 bg-white px-2 py-0.5 rounded text-xs border border-purple-100 block">
                    ceo@timetracker.local / admin123
                  </code>
                  <code className="text-purple-700 bg-white px-2 py-0.5 rounded text-xs border border-purple-100 block">
                    hr@timetracker.local / admin123
                  </code>
                </div>
              </div>
              <div>
                <span className="font-medium text-purple-700 text-xs">Entwicklung</span>
                <div className="mt-1 space-y-1">
                  <code className="text-purple-700 bg-white px-2 py-0.5 rounded text-xs border border-purple-100 block">
                    lead.dev@timetracker.local / user123
                  </code>
                  <code className="text-purple-700 bg-white px-2 py-0.5 rounded text-xs border border-purple-100 block">
                    anna.dev@timetracker.local / user123
                  </code>
                  <code className="text-purple-700 bg-white px-2 py-0.5 rounded text-xs border border-purple-100 block">
                    ben.dev@timetracker.local / user123
                  </code>
                  <code className="text-purple-700 bg-white px-2 py-0.5 rounded text-xs border border-purple-100 block">
                    cora.dev@timetracker.local / user123
                  </code>
                </div>
              </div>
              <div>
                <span className="font-medium text-purple-700 text-xs">Vertrieb</span>
                <div className="mt-1 space-y-1">
                  <code className="text-purple-700 bg-white px-2 py-0.5 rounded text-xs border border-purple-100 block">
                    lead.sales@timetracker.local / user123
                  </code>
                  <code className="text-purple-700 bg-white px-2 py-0.5 rounded text-xs border border-purple-100 block">
                    david.sales@timetracker.local / user123
                  </code>
                  <code className="text-purple-700 bg-white px-2 py-0.5 rounded text-xs border border-purple-100 block">
                    eva.sales@timetracker.local / user123
                  </code>
                  <code className="text-purple-700 bg-white px-2 py-0.5 rounded text-xs border border-purple-100 block">
                    finn.sales@timetracker.local / user123
                  </code>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  const t = useTranslations();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100 flex items-center justify-center">
          <div className="animate-pulse text-purple-600">{t("auth.loading")}</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

