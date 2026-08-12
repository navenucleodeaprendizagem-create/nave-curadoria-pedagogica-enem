export default function UsuariosManualNoticeV011160() {
  return (
    <section className="mb-6 rounded-3xl border border-teal-200 bg-teal-50/70 p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
        Gestão de acessos
      </p>

      <h2 className="mt-1 text-lg font-bold text-slate-950">
        Cadastro administrado na planilha oficial
      </h2>

      <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">
        Nesta etapa, a página de usuários funciona como consulta. Inclusões,
        alterações de perfil, área, disciplinas e ativação/desativação devem ser
        feitas diretamente na aba <strong>USUARIOS</strong> da planilha oficial
        do Sistema NAVE.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Identidade principal", "email_autenticacao"],
          ["Vínculo Google", "id_google automático"],
          ["Perfis", "Professor · Coordenador · Administrador"],
          ["Fonte oficial", "aba USUARIOS"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-teal-100 bg-white p-3"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              {label}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-800">
              {value}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Ao cadastrar uma pessoa, não preencha manualmente o campo
        <strong> id_google</strong>. O vínculo deve ser estabelecido pelo
        processo de autenticação do sistema.
      </p>
    </section>
  );
}
