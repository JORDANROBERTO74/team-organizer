#### English version

<div align="center"><strong>Next.js Authentication Demo</strong></div>
<div align="center">Complete authentication example with Next.js 15 and Supabase</div>
<br />

## Description

Next.js Authentication Demo is a complete authentication implementation showcasing all the essential features of user authentication with Supabase. This project demonstrates login, registration, password recovery, protected routes, and secure session management using Next.js 15 App Router.

## Technologies Used

### Core

- Framework - [Next.js 15.0.0 (App Router)](https://nextjs.org)
- Authentication - [Supabase Auth](https://supabase.com/docs/guides/auth)
- Language - [TypeScript](https://www.typescriptlang.org)
- Styling - [Tailwind CSS](https://tailwindcss.com)
- Deployment - [Vercel](https://vercel.com)

### UI/UX

- Components - [shadcn/ui](https://ui.shadcn.com)
- Primitives - [Radix UI](https://www.radix-ui.com)
- Icons - [Lucide React](https://lucide.dev)
- Theme - [next-themes](https://github.com/pacocoursey/next-themes)

### Authentication

- SSR Package - [@supabase/ssr](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- Client - [@supabase/supabase-js](https://github.com/supabase/supabase-js)
- Session Management - HTTP-only cookies
- Middleware - Route protection

## Key Features

- 🔐 **Email & Password Auth** - Complete user registration and login flow
- 📧 **Email Verification** - Secure email confirmation on sign up
- 🔑 **Password Recovery** - Reset forgotten passwords via email
- 🛡️ **Protected Routes** - Middleware-based route protection
- 🍪 **Secure Sessions** - HTTP-only cookie-based session management
- ⚡ **Server & Client** - Works across all Next.js component types
- 🎨 **Modern UI** - Beautiful shadcn/ui components
- 🌓 **Dark Mode** - Built-in theme switching support
- 📱 **Responsive** - Optimized for all devices

## Project Architecture

```
app/
├── auth/                      # Authentication pages
│   ├── login/                # Login page
│   ├── sign-up/             # Registration page
│   ├── sign-up-success/      # Post-registration page
│   ├── forgot-password/      # Password recovery
│   ├── update-password/      # Update password page
│   ├── confirm/              # Email verification route
│   └── error/                # Error handling page
│
├── protected/                 # Protected routes
│   ├── layout.tsx           # Protected layout wrapper
│   └── page.tsx              # Protected content
│
├── layout.tsx                # Root layout
├── page.tsx                  # Home page
└── globals.css               # Global styles

components/
├── auth-button.tsx           # Navigation auth button
├── login-form.tsx            # Login form component
├── sign-up-form.tsx          # Sign up form component
├── logout-button.tsx         # Logout functionality
├── forgot-password-form.tsx  # Password reset form
├── update-password-form.tsx  # Password update form
├── theme-switcher.tsx        # Dark mode toggle
└── ui/                       # shadcn/ui components (20+)

lib/supabase/
├── server.ts                 # Server-side client
├── client.ts                 # Browser client
├── middleware.ts             # Session management
└── utils.ts                  # Helper functions
```

## APIs

This project uses **Supabase Auth API** for all authentication operations:

- **Email Verification** - Automatic email confirmation on sign up
- **Password Reset** - Secure password recovery via email
- **Session Management** - HTTP-only cookies with automatic refresh
- **Claims-based Auth** - JWT token claims for user data

All auth operations are handled through `@supabase/ssr` package for optimal performance.

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd login-with-supabase

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

> [!NOTE]
> This project uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. You can use either the new **publishable** key or the legacy **anon** key format. Both keys can be found in your Supabase project's [API settings](https://supabase.com/dashboard/project/_/settings/api)

## How It Works

- **Middleware** - Protects routes and refreshes sessions automatically on every request
- **Server Components** - Check auth status with `getClaims()` for server-side rendering
- **Client Components** - Handle forms and user interactions on the client
- **Cookies** - Sessions managed securely with HTTP-only cookies
- **SSR Ready** - Full compatibility with Next.js Server-Side Rendering

## Project Purpose

This project serves as a comprehensive demonstration and reference implementation for adding complete authentication to Next.js applications using Supabase. It showcases best practices for authentication, proper session management, protected routes, and modern UI/UX with accessibility in mind.

## Live Preview

Deploy this project to see it live: [Vercel Deployment Guide](https://vercel.com/docs)

---

<br />

---

<br />

#### Versión en español

<div align="center"><strong>Demo de Autenticación con Next.js</strong></div>
<div align="center">Ejemplo completo de autenticación con Next.js 15 y Supabase</div>
<br />

## Descripción

Demo de Autenticación con Next.js es una implementación completa que demuestra todas las características esenciales de autenticación de usuarios con Supabase. Este proyecto muestra login, registro, recuperación de contraseña, rutas protegidas y gestión segura de sesiones usando Next.js 15 App Router.

## Tecnologías Utilizadas

### Core

- Framework - [Next.js 15.0.0 (App Router)](https://nextjs.org)
- Autenticación - [Supabase Auth](https://supabase.com/docs/guides/auth)
- Lenguaje - [TypeScript](https://www.typescriptlang.org)
- Estilos - [Tailwind CSS](https://tailwindcss.com)
- Despliegue - [Vercel](https://vercel.com)

### UI/UX

- Componentes - [shadcn/ui](https://ui.shadcn.com)
- Primitivos - [Radix UI](https://www.radix-ui.com)
- Iconos - [Lucide React](https://lucide.dev)
- Tema - [next-themes](https://github.com/pacocoursey/next-themes)

### Autenticación

- Paquete SSR - [@supabase/ssr](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- Cliente - [@supabase/supabase-js](https://github.com/supabase/supabase-js)
- Gestión de Sesión - Cookies HTTP-only
- Middleware - Protección de rutas

## Características Principales

- 🔐 **Autenticación Email/Contraseña** - Flujo completo de registro e inicio de sesión
- 📧 **Verificación por Email** - Confirmación segura por correo electrónico al registrarse
- 🔑 **Recuperación de Contraseña** - Restablecer contraseñas olvidadas vía email
- 🛡️ **Rutas Protegidas** - Protección basada en middleware
- 🍪 **Sesiones Seguras** - Gestión de sesiones con cookies HTTP-only
- ⚡ **Servidor y Cliente** - Funciona en todos los tipos de componentes de Next.js
- 🎨 **UI Moderna** - Hermosos componentes shadcn/ui
- 🌓 **Modo Oscuro** - Soporte integrado para cambio de tema
- 📱 **Responsive** - Optimizado para todos los dispositivos

## Arquitectura del Proyecto

```
app/
├── auth/                      # Páginas de autenticación
│   ├── login/                # Página de inicio de sesión
│   ├── sign-up/             # Página de registro
│   ├── sign-up-success/      # Página post-registro
│   ├── forgot-password/      # Recuperación de contraseña
│   ├── update-password/      # Actualización de contraseña
│   ├── confirm/              # Ruta de verificación por email
│   └── error/                # Manejo de errores
│
├── protected/                 # Rutas protegidas
│   ├── layout.tsx           # Wrapper del layout protegido
│   └── page.tsx              # Contenido protegido
│
├── layout.tsx                # Layout raíz
├── page.tsx                  # Página principal
└── globals.css               # Estilos globales

components/
├── auth-button.tsx           # Botón de auth para navegación
├── login-form.tsx            # Componente formulario de login
├── sign-up-form.tsx          # Componente formulario de registro
├── logout-button.tsx         # Funcionalidad de logout
├── forgot-password-form.tsx  # Formulario de reset de contraseña
├── update-password-form.tsx  # Formulario de actualización de contraseña
├── theme-switcher.tsx        # Toggle de modo oscuro
└── ui/                       # Componentes shadcn/ui (20+)

lib/supabase/
├── server.ts                 # Cliente del lado del servidor
├── client.ts                 # Cliente del navegador
├── middleware.ts             # Gestión de sesión
└── utils.ts                  # Funciones auxiliares
```

## APIs

Este proyecto usa la **API de Autenticación de Supabase** para todas las operaciones de autenticación:

- **Verificación por Email** - Confirmación automática por email al registrarse
- **Restablecimiento de Contraseña** - Recuperación segura de contraseña por email
- **Gestión de Sesión** - Cookies HTTP-only con renovación automática
- **Auth basado en Claims** - Claims JWT para datos de usuario

Todas las operaciones de auth se manejan a través del paquete `@supabase/ssr` para un rendimiento óptimo.

## Instalación

```bash
# Clonar el repositorio
git clone <your-repo-url>
cd login-with-supabase

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Iniciar servidor de producción
npm start
```

## Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_del_proyecto_supabase
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu_clave_publica_supabase
```

> [!NOTE]
> Este proyecto usa `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Puedes usar la nueva clave **publishable** o el formato legacy **anon**. Ambas claves se encuentran en la [configuración de API](https://supabase.com/dashboard/project/_/settings/api) de tu proyecto de Supabase

## Cómo Funciona

- **Middleware** - Protege rutas y renueva sesiones automáticamente en cada petición
- **Componentes de Servidor** - Verifican el estado de autenticación con `getClaims()` para renderizado del lado del servidor
- **Componentes de Cliente** - Manejan formularios e interacciones del usuario en el cliente
- **Cookies** - Las sesiones se gestionan de forma segura con cookies HTTP-only
- **Listo para SSR** - Compatibilidad completa con Server-Side Rendering de Next.js

## Propósito del Proyecto

Este proyecto sirve como una demostración completa e implementación de referencia para agregar autenticación completa a aplicaciones Next.js usando Supabase. Muestra las mejores prácticas para autenticación, gestión adecuada de sesiones, implementación de rutas protegidas y UI/UX moderna con accesibilidad en mente.

## Vista Previa en Vivo

Despliega este proyecto para verlo en vivo: [Guía de Despliegue en Vercel](https://vercel.com/docs)

---

¡Gracias por explorar el Demo de Autenticación con Next.js! 🚀
