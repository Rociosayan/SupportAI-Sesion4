import { Mail, UserRound } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'

export function Profile() {
  return (
    <div className="page">
      <PageHeader
        title="Mi perfil"
        subtitle="Datos del agente asignado a esta bandeja local."
      />
      <section className="panel profile-card">
        <div className="profile-avatar">
          <UserRound size={32} />
        </div>
        <div>
          <h2>Ana Morales</h2>
          <p>Agente de soporte</p>
          <dl className="detail-grid">
            <div>
              <dt>Equipo</dt>
              <dd>Atención al cliente</dd>
            </div>
            <div>
              <dt>Correo</dt>
              <dd>
                <span className="inline-icon">
                  <Mail size={16} />
                  ana.morales@supportai.local
                </span>
              </dd>
            </div>
            <div>
              <dt>Turno</dt>
              <dd>Lunes a viernes, 09:00 a 18:00</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  )
}
