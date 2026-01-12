import type { Metadata } from "next";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  Users,
  Shield,
  Plus,
  CheckCircle2,
  ArrowRight,
  Clock,
  Zap,
  Lock,
  BarChart3,
  LayoutDashboard,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Inicio",
  description:
    "Organiza tus equipos de trabajo con facilidad. Crea equipos, gestiona miembros y programa horarios en un solo lugar. La solución perfecta para coordinar tus equipos de manera eficiente y visual.",
  openGraph: {
    title: "Organizador de Equipos - Gestiona tus equipos de trabajo",
    description:
      "Organiza tus equipos de trabajo con facilidad. Crea equipos, gestiona miembros y programa horarios en un solo lugar.",
    type: "website",
  },
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const isAuthenticated = !!user;
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full flex justify-center border-b border-b-foreground/10 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="w-full max-w-7xl flex justify-between items-center p-2 sm:p-3 px-2 sm:px-5 text-sm gap-2">
          <div className="flex gap-1.5 sm:gap-3 items-center font-semibold min-w-0 flex-1">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <Link
              href={"/"}
              className="text-xs sm:text-base md:text-lg truncate font-semibold"
            >
              <span className="hidden md:inline">Organizador de Equipos</span>
              <span className="hidden sm:inline md:hidden">Organizador</span>
              <span className="sm:hidden">Equipos</span>
            </Link>
          </div>
          <div
            className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0"
            suppressHydrationWarning
          >
            <AuthButton />
            <div className="hidden sm:block" suppressHydrationWarning>
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center gap-8 px-4 py-20 md:py-32">
        <div className="flex flex-col gap-6 items-center text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-muted text-sm font-medium">
            <Zap className="h-4 w-4" />
            Sistema de organización profesional
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Organiza tus{" "}
            <span className="text-primary">equipos de trabajo</span> con
            facilidad
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Crea equipos, gestiona miembros y programa horarios en un solo
            lugar. La solución perfecta para coordinar tus equipos de manera
            eficiente y visual.
          </p>
          <div className="flex gap-4 mt-4">
            {isAuthenticated ? (
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Ir al Dashboard
                  <LayoutDashboard className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            ) : (
              <div className="flex gap-2 flex-col md:flex-row w-full">
                <Button asChild size="lg">
                  <Link href="/auth/sign-up">
                    Comenzar gratis
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/auth/login">Iniciar sesión</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Todo lo que necesitas para organizar tus equipos
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Funcionalidades diseñadas para facilitar la gestión y coordinación
              de equipos de trabajo
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Gestión de Equipos</CardTitle>
                <CardDescription>
                  Crea y administra múltiples equipos de trabajo de manera
                  independiente. Cada equipo tiene su propio espacio privado.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Calendario Inteligente</CardTitle>
                <CardDescription>
                  Visualiza todos los horarios de tus equipos en un calendario
                  mensual. Organiza fechas y horarios con colores
                  personalizados.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Control de Acceso</CardTitle>
                <CardDescription>
                  Solo tú puedes modificar tus equipos. Los miembros pueden ver
                  la información pero no realizar cambios.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Agregar Miembros</CardTitle>
                <CardDescription>
                  Invita miembros a tus equipos y asigna roles. Administra quién
                  forma parte de cada equipo de trabajo.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Horarios Programados</CardTitle>
                <CardDescription>
                  Programa fechas y horarios específicos para cada equipo.
                  Agrega notas y detalles importantes para cada evento.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Rápido y Eficiente</CardTitle>
                <CardDescription>
                  Interfaz moderna y rápida. Accede a toda la información de tus
                  equipos en segundos desde cualquier dispositivo.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Cómo funciona
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              En solo tres pasos podrás empezar a organizar tus equipos
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 mt-12">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Crea tu cuenta</h3>
              <p className="text-muted-foreground">
                Regístrate de forma rápida y segura con tu correo electrónico.
                Verifica tu cuenta y accede al dashboard.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Crea tu primer equipo
              </h3>
              <p className="text-muted-foreground">
                Define el nombre, descripción y color de tu equipo. Personaliza
                cada aspecto para identificarlo fácilmente.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Organiza y programa
              </h3>
              <p className="text-muted-foreground">
                Agrega miembros a tus equipos y programa horarios en el
                calendario. Visualiza todo en un solo lugar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="w-full py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                ¿Por qué elegir nuestro organizador?
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-primary mt-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      Gestión independiente
                    </h3>
                    <p className="text-muted-foreground">
                      Cada usuario gestiona sus propios equipos. Solo tú puedes
                      modificar la información de tus equipos.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-primary mt-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      Seguridad garantizada
                    </h3>
                    <p className="text-muted-foreground">
                      Sistema de autenticación seguro con Supabase. Tus datos
                      están protegidos y solo accesibles por ti.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-primary mt-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Vista de calendario</h3>
                    <p className="text-muted-foreground">
                      Visualiza todos tus equipos y horarios en un calendario
                      mensual intuitivo y fácil de usar.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-primary mt-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Totalmente gratuito</h3>
                    <p className="text-muted-foreground">
                      Sin costos ocultos. Crea todos los equipos que necesites
                      sin restricciones.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Dashboard completo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Accede a un dashboard personalizado donde verás todos tus
                    equipos, estadísticas rápidas y acceso directo a las
                    funciones principales.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    Privacidad total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Solo tú puedes ver y modificar tus equipos. Los miembros que
                    agregues solo pueden visualizar la información, manteniendo
                    el control total en tus manos.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl md:text-4xl font-bold mb-4">
                ¿Listo para comenzar?
              </CardTitle>
              <CardDescription className="text-lg">
                Crea tu cuenta gratis y comienza a organizar tus equipos de
                trabajo en minutos
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Button asChild size="lg">
                  <Link href="/dashboard">
                    Ir al Dashboard
                    <LayoutDashboard className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg">
                    <Link href="/auth/sign-up">
                      Crear cuenta gratuita
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/auth/login">Ya tengo una cuenta</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t py-5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span className="font-semibold">Organizador de Equipos</span>
            </div>
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © 2026 - Roberto Jordan
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <p>
              Construido con{" "}
              <a
                href="https://nextjs.org"
                target="_blank"
                rel="noreferrer"
                className="font-semibold hover:underline text-foreground"
              >
                Next.js
              </a>{" "}
              y{" "}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="font-semibold hover:underline text-foreground"
              >
                Supabase
              </a>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
