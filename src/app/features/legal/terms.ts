import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="relative min-h-screen">

      <!-- Ambient -->
      <div class="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div class="neo-grid-bg absolute inset-0 opacity-30"></div>
        <span class="neo-orb red"    style="width:500px;height:500px;top:-10%;left:-5%;opacity:0.15;"></span>
        <span class="neo-orb violet" style="width:400px;height:400px;bottom:10%;right:-5%;opacity:0.12;animation-delay:2s;"></span>
      </div>

      <div class="max-w-3xl mx-auto px-6 py-16">

        <!-- Header -->
        <div class="mb-10">
          <a routerLink="/"
             class="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-primary
                    transition-colors mb-6">
            ← Volver al inicio
          </a>
          <p class="neo-stat-label mb-2">NeoGaming</p>
          <h1 class="font-display text-[36px] font-bold tracking-[-0.02em] text-text-primary leading-tight">
            Términos y Condiciones
          </h1>
          <p class="text-text-muted text-[13px] mt-2 font-mono">Versión vigente: 28 de mayo de 2026</p>
        </div>

        <!-- Divider -->
        <div class="border-t border-border mb-10"></div>

        <!-- Content -->
        <div class="flex flex-col gap-10 text-[15px] leading-relaxed text-text-secondary">

          <section>
            <h2 class="text-[18px] font-display font-bold text-text-primary mb-3">
              1. Aceptación de los términos
            </h2>
            <p>
              Al acceder y utilizar la plataforma NeoGaming, la Persona Usuaria acepta cumplir los presentes
              Términos y Condiciones y todas las políticas aplicables dentro de la plataforma.
            </p>
          </section>

          <section>
            <h2 class="text-[18px] font-display font-bold text-text-primary mb-3">
              2. Uso de la plataforma
            </h2>
            <p class="mb-3">
              NeoGaming es una plataforma de comercio electrónico enfocada en productos tecnológicos y gamer.
              Las Personas Usuarias deberán utilizar el sitio de manera responsable, legal y respetuosa.
            </p>
            <p>
              Queda prohibido realizar actividades fraudulentas, ilegales o que afecten el funcionamiento
              de la plataforma.
            </p>
          </section>

          <section>
            <h2 class="text-[18px] font-display font-bold text-text-primary mb-3">
              3. Registro y cuenta
            </h2>
            <p class="mb-3">
              Para acceder a determinados servicios, la Persona Usuaria deberá registrarse proporcionando
              información veraz, precisa y actualizada.
            </p>
            <p class="mb-3">
              La cuenta es personal e intransferible. La Persona Usuaria será responsable de mantener la
              confidencialidad de su contraseña y de todas las actividades realizadas desde su cuenta.
            </p>
            <p>
              NeoGaming podrá suspender o cancelar cuentas que incumplan estos términos.
            </p>
          </section>

          <section>
            <h2 class="text-[18px] font-display font-bold text-text-primary mb-3">
              4. Productos y disponibilidad
            </h2>
            <p class="mb-3">
              Todos los productos publicados en NeoGaming están sujetos a disponibilidad.
            </p>
            <p class="mb-3">
              NeoGaming podrá modificar precios, promociones, imágenes o descripciones de los productos
              sin previo aviso.
            </p>
            <p>
              Las imágenes publicadas son ilustrativas y pueden presentar variaciones respecto al
              producto final.
            </p>
          </section>

          <section>
            <h2 class="text-[18px] font-display font-bold text-text-primary mb-3">
              5. Pagos
            </h2>
            <p class="mb-3">
              NeoGaming ofrece métodos de pago seguros para las compras realizadas dentro de la plataforma.
            </p>
            <p>
              La Persona Usuaria se compromete a realizar pagos válidos y autorizados. NeoGaming podrá
              rechazar operaciones sospechosas o fraudulentas.
            </p>
          </section>

          <section>
            <h2 class="text-[18px] font-display font-bold text-text-primary mb-3">
              6. Envíos
            </h2>
            <p class="mb-3">
              Los pedidos serán enviados a la dirección registrada por la Persona Usuaria dentro de los
              tiempos estimados informados durante la compra.
            </p>
            <p>
              Los tiempos de entrega pueden variar según la ubicación y la disponibilidad del producto.
            </p>
          </section>

          <section>
            <h2 class="text-[18px] font-display font-bold text-text-primary mb-3">
              7. Garantías y devoluciones
            </h2>
            <p class="mb-3">
              Las Personas Usuarias podrán solicitar cambios, devoluciones o garantías conforme a las
              políticas establecidas por NeoGaming y la legislación vigente en Colombia.
            </p>
            <p>
              No se aceptarán devoluciones de productos dañados por mal uso o manipulación indebida.
            </p>
          </section>

          <section>
            <h2 class="text-[18px] font-display font-bold text-text-primary mb-3">
              8. Privacidad de datos
            </h2>
            <p>
              NeoGaming protege la información personal de las Personas Usuarias y utilizará los datos
              únicamente para procesar compras, brindar soporte y mejorar la experiencia dentro de
              la plataforma.
            </p>
          </section>

          <section>
            <h2 class="text-[18px] font-display font-bold text-text-primary mb-3">
              9. Propiedad intelectual
            </h2>
            <p class="mb-3">
              Todo el contenido de NeoGaming, incluyendo logotipos, imágenes, diseños, textos y software,
              es propiedad de NeoGaming y está protegido por las leyes de propiedad intelectual.
            </p>
            <p>
              Queda prohibida la reproducción o uso no autorizado del contenido de la plataforma.
            </p>
          </section>

          <section>
            <h2 class="text-[18px] font-display font-bold text-text-primary mb-3">
              10. Sanciones
            </h2>
            <p>
              NeoGaming podrá advertir, suspender o cancelar cuentas que incumplan los presentes Términos
              y Condiciones o realicen actividades que afecten la seguridad y funcionamiento de la plataforma.
            </p>
          </section>

          <section>
            <h2 class="text-[18px] font-display font-bold text-text-primary mb-3">
              11. Modificaciones
            </h2>
            <p>
              NeoGaming podrá modificar los presentes Términos y Condiciones en cualquier momento. Los
              cambios serán publicados dentro de la plataforma y entrarán en vigencia desde su publicación.
            </p>
          </section>

          <section>
            <h2 class="text-[18px] font-display font-bold text-text-primary mb-3">
              12. Jurisdicción y ley aplicable
            </h2>
            <p class="mb-3">
              Los presentes Términos y Condiciones se rigen por las leyes de la República de Colombia.
            </p>
            <p>
              Cualquier controversia relacionada con el uso de la plataforma será resuelta por las
              autoridades competentes de Colombia.
            </p>
          </section>

        </div>

        <!-- Footer note -->
        <div class="mt-14 border-t border-border pt-8 flex items-center justify-between flex-wrap gap-4">
          <p class="text-[12px] text-text-muted font-mono">
            © 2026 NeoGaming · Versión 28 de mayo de 2026
          </p>
          <a routerLink="/register"
             class="text-[13px] text-accent hover:underline transition-colors">
            Volver al registro →
          </a>
        </div>

      </div>
    </div>
  `,
})
export class TermsComponent {}
