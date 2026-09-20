export function LlmIntegrationFlow() {
  return (
    <section className="lab-form integration-flow">
      <h3>Próximo paso: integración mediante API</h3>
      <ol className="flow-schema" aria-label="Recorrido conceptual de una futura API">
        <li>SupportAI</li>
        <li>→</li>
        <li>API</li>
        <li>→</li>
        <li>LLM</li>
        <li>→</li>
        <li>respuesta JSON</li>
        <li>→</li>
        <li>SupportAI</li>
      </ol>

      <p className="notice">
        En esta sesión el intercambio con el LLM se realiza manualmente para comprender
        cada etapa del proceso. En una integración mediante API, este intercambio se
        automatiza desde la aplicación.
      </p>
    </section>
  )
}
