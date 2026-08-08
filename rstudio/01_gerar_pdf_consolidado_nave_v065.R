# ============================================================
# NAVE — GERADOR DE PDF CONSOLIDADO A PARTIR DO PACOTE EDITORIAL
# Versão 0.6.5
#
# Objetivo:
# 1. Ler o CSV gerado pelo Apps Script.
# 2. Baixar os PDFs originais do Google Drive.
# 3. Extrair as páginas indicadas.
# 4. Respeitar a ordem editorial.
# 5. Unir tudo em um único PDF.
# 6. Gerar um relatório de auditoria.
#
# Observação:
# Esta primeira versão trabalha com PÁGINAS INTEIRAS.
# O recorte individual de cada questão será uma etapa posterior.
# ============================================================


# ------------------------------------------------------------
# 0. PACOTES
# ------------------------------------------------------------

pacotes <- c(
  "readr",
  "dplyr",
  "purrr",
  "stringr",
  "fs",
  "googledrive",
  "pdftools",
  "qpdf",
  "tibble"
)

instalar_se_necessario <- function(pacote) {
  if (!requireNamespace(pacote, quietly = TRUE)) {
    install.packages(pacote)
  }
}

invisible(lapply(pacotes, instalar_se_necessario))

library(readr)
library(dplyr)
library(purrr)
library(stringr)
library(fs)
library(googledrive)
library(pdftools)
library(qpdf)
library(tibble)


# ------------------------------------------------------------
# 1. CONFIGURAÇÃO PRINCIPAL
# ------------------------------------------------------------

# Escolha uma pasta local definitiva para o projeto.
# Altere apenas esta linha.
DIR_PROJETO <- "C:/NAVE/NAVE_PACOTES_EDITORIAIS"

DIR_CSV <- path(DIR_PROJETO, "01_csv")
DIR_FONTES <- path(DIR_PROJETO, "02_pdfs_originais")
DIR_PAGINAS <- path(DIR_PROJETO, "03_paginas_extraidas")
DIR_SAIDA <- path(DIR_PROJETO, "04_pdf_final")
DIR_AUDITORIA <- path(DIR_PROJETO, "05_auditoria")

dir_create(c(
  DIR_PROJETO,
  DIR_CSV,
  DIR_FONTES,
  DIR_PAGINAS,
  DIR_SAIDA,
  DIR_AUDITORIA
))


# ------------------------------------------------------------
# 2. FUNÇÕES AUXILIARES
# ------------------------------------------------------------

limpar_nome_arquivo <- function(texto) {
  texto |>
    as.character() |>
    str_replace_all("[^A-Za-z0-9_-]+", "_") |>
    str_replace_all("_+", "_") |>
    str_remove("^_") |>
    str_remove("_$")
}


validar_colunas <- function(base, colunas_obrigatorias) {
  faltantes <- setdiff(colunas_obrigatorias, names(base))

  if (length(faltantes) > 0) {
    stop(
      paste0(
        "O CSV não possui as colunas obrigatórias: ",
        paste(faltantes, collapse = ", ")
      ),
      call. = FALSE
    )
  }
}


baixar_pdf_drive <- function(id_drive, nome_destino) {
  destino <- path(DIR_FONTES, nome_destino)

  if (file_exists(destino)) {
    return(destino)
  }

  if (is.na(id_drive) || str_trim(id_drive) == "") {
    stop("ID do arquivo do Google Drive não informado.", call. = FALSE)
  }

  arquivo_drive <- drive_get(as_id(id_drive))

  drive_download(
    file = arquivo_drive,
    path = destino,
    overwrite = TRUE
  )

  if (!file_exists(destino)) {
    stop(
      paste0("O PDF não foi baixado: ", nome_destino),
      call. = FALSE
    )
  }

  destino
}


extrair_pagina <- function(
  arquivo_pdf,
  pagina,
  ordem,
  id_ocorrencia,
  id_pacote
) {
  info <- pdf_info(arquivo_pdf)
  total_paginas <- info$pages

  pagina <- suppressWarnings(as.integer(pagina))

  if (is.na(pagina) || pagina < 1) {
    stop(
      paste0(
        "Página inválida para a questão ",
        id_ocorrencia,
        ": ",
        pagina
      ),
      call. = FALSE
    )
  }

  if (pagina > total_paginas) {
    stop(
      paste0(
        "A página ",
        pagina,
        " não existe no PDF da questão ",
        id_ocorrencia,
        ". Total de páginas: ",
        total_paginas
      ),
      call. = FALSE
    )
  }

  nome_saida <- sprintf(
    "%03d_%s_%s_p%04d.pdf",
    ordem,
    limpar_nome_arquivo(id_pacote),
    limpar_nome_arquivo(id_ocorrencia),
    pagina
  )

  caminho_saida <- path(DIR_PAGINAS, nome_saida)

  pdf_subset(
    input = arquivo_pdf,
    pages = pagina,
    output = caminho_saida
  )

  if (!file_exists(caminho_saida)) {
    stop(
      paste0(
        "A página não foi extraída para a questão ",
        id_ocorrencia
      ),
      call. = FALSE
    )
  }

  caminho_saida
}


# ------------------------------------------------------------
# 3. ESCOLHER E LER O CSV
# ------------------------------------------------------------

cat("\n============================================================\n")
cat("NAVE — GERADOR DE PDF CONSOLIDADO\n")
cat("============================================================\n\n")

cat("Selecione o CSV gerado pelo Apps Script...\n")

ARQUIVO_CSV <- file.choose()

if (!file_exists(ARQUIVO_CSV)) {
  stop("O arquivo CSV selecionado não existe.", call. = FALSE)
}

nome_csv_copiado <- path_file(ARQUIVO_CSV)
destino_csv <- path(DIR_CSV, nome_csv_copiado)

file_copy(
  path = ARQUIVO_CSV,
  new_path = destino_csv,
  overwrite = TRUE
)

base <- read_csv(
  file = destino_csv,
  show_col_types = FALSE,
  locale = locale(encoding = "UTF-8"),
  na = c("", "NA", "N/A")
)

colunas_obrigatorias <- c(
  "id_pacote_pdf",
  "id_projeto_editorial",
  "id_sequencia",
  "ordem_pdf",
  "id_ocorrencia",
  "colecao_origem",
  "nome_publico_pdf",
  "url_pdf",
  "id_arquivo_drive",
  "pagina_pdf",
  "incluir_no_pdf"
)

validar_colunas(base, colunas_obrigatorias)


# ------------------------------------------------------------
# 4. PREPARAR A BASE
# ------------------------------------------------------------

base_tratada <- base |>
  mutate(
    ordem_pdf = as.integer(ordem_pdf),
    pagina_pdf = as.integer(pagina_pdf),
    incluir_no_pdf = str_to_lower(str_trim(incluir_no_pdf)),
    id_arquivo_drive = as.character(id_arquivo_drive),
    nome_publico_pdf = as.character(nome_publico_pdf),
    id_ocorrencia = as.character(id_ocorrencia)
  ) |>
  filter(incluir_no_pdf %in% c("sim", "yes", "true", "1")) |>
  arrange(ordem_pdf)

if (nrow(base_tratada) == 0) {
  stop(
    "O pacote não possui itens marcados para inclusão no PDF.",
    call. = FALSE
  )
}

id_pacote <- unique(base_tratada$id_pacote_pdf)

if (length(id_pacote) != 1) {
  stop(
    "O CSV possui mais de um id_pacote_pdf. Use um pacote por arquivo.",
    call. = FALSE
  )
}

id_pacote <- id_pacote[[1]]

cat("Pacote:", id_pacote, "\n")
cat("Itens:", nrow(base_tratada), "\n")
cat(
  "Fontes distintas:",
  n_distinct(base_tratada$id_arquivo_drive),
  "\n\n"
)


# ------------------------------------------------------------
# 5. AUTENTICAÇÃO NO GOOGLE DRIVE
# ------------------------------------------------------------

cat("Autenticando no Google Drive...\n")
cat("O navegador poderá abrir para autorização.\n\n")

drive_auth()


# ------------------------------------------------------------
# 6. BAIXAR OS PDFs ORIGINAIS
# ------------------------------------------------------------

fontes <- base_tratada |>
  distinct(
    id_arquivo_drive,
    nome_publico_pdf,
    colecao_origem
  ) |>
  mutate(
    nome_arquivo_local = paste0(
      limpar_nome_arquivo(nome_publico_pdf),
      "_",
      str_sub(id_arquivo_drive, 1, 8),
      ".pdf"
    )
  )

fontes_baixadas <- fontes |>
  mutate(
    caminho_pdf = map2_chr(
      id_arquivo_drive,
      nome_arquivo_local,
      baixar_pdf_drive
    )
  )

cat("PDFs originais disponíveis localmente:", nrow(fontes_baixadas), "\n\n")


# ------------------------------------------------------------
# 7. EXTRAIR AS PÁGINAS NA ORDEM EDITORIAL
# ------------------------------------------------------------

base_processamento <- base_tratada |>
  left_join(
    fontes_baixadas |>
      select(id_arquivo_drive, caminho_pdf),
    by = "id_arquivo_drive"
  )

resultado <- vector("list", nrow(base_processamento))

for (i in seq_len(nrow(base_processamento))) {
  item <- base_processamento[i, ]

  cat(
    sprintf(
      "[%d/%d] Extraindo %s — página %d\n",
      i,
      nrow(base_processamento),
      item$id_ocorrencia,
      item$pagina_pdf
    )
  )

  resultado[[i]] <- tryCatch(
    {
      pagina_extraida <- extrair_pagina(
        arquivo_pdf = item$caminho_pdf,
        pagina = item$pagina_pdf,
        ordem = item$ordem_pdf,
        id_ocorrencia = item$id_ocorrencia,
        id_pacote = id_pacote
      )

      tibble(
        ordem_pdf = item$ordem_pdf,
        id_ocorrencia = item$id_ocorrencia,
        colecao_origem = item$colecao_origem,
        pagina_pdf = item$pagina_pdf,
        caminho_pdf_origem = item$caminho_pdf,
        caminho_pagina_extraida = pagina_extraida,
        status_processamento = "OK",
        erro = NA_character_
      )
    },
    error = function(e) {
      tibble(
        ordem_pdf = item$ordem_pdf,
        id_ocorrencia = item$id_ocorrencia,
        colecao_origem = item$colecao_origem,
        pagina_pdf = item$pagina_pdf,
        caminho_pdf_origem = item$caminho_pdf,
        caminho_pagina_extraida = NA_character_,
        status_processamento = "ERRO",
        erro = conditionMessage(e)
      )
    }
  )
}

auditoria <- bind_rows(resultado) |>
  arrange(ordem_pdf)

arquivo_auditoria <- path(
  DIR_AUDITORIA,
  paste0(
    "auditoria_",
    limpar_nome_arquivo(id_pacote),
    "_",
    format(Sys.time(), "%Y%m%d_%H%M%S"),
    ".csv"
  )
)

write_excel_csv(
  auditoria,
  arquivo_auditoria,
  na = ""
)

erros <- auditoria |>
  filter(status_processamento == "ERRO")

if (nrow(erros) > 0) {
  print(erros)

  stop(
    paste0(
      "A geração foi interrompida. Foram encontrados ",
      nrow(erros),
      " erro(s). Consulte: ",
      arquivo_auditoria
    ),
    call. = FALSE
  )
}


# ------------------------------------------------------------
# 8. UNIR AS PÁGINAS
# ------------------------------------------------------------

paginas_ordenadas <- auditoria |>
  arrange(ordem_pdf) |>
  pull(caminho_pagina_extraida)

nome_pdf_final <- paste0(
  "NAVE_",
  limpar_nome_arquivo(id_pacote),
  "_",
  format(Sys.time(), "%Y%m%d_%H%M%S"),
  ".pdf"
)

arquivo_pdf_final <- path(
  DIR_SAIDA,
  nome_pdf_final
)

qpdf::pdf_combine(
  input = paginas_ordenadas,
  output = arquivo_pdf_final
)

if (!file_exists(arquivo_pdf_final)) {
  stop(
    "O PDF consolidado não foi criado.",
    call. = FALSE
  )
}


# ------------------------------------------------------------
# 9. VALIDAÇÃO FINAL
# ------------------------------------------------------------

info_final <- pdf_info(arquivo_pdf_final)

cat("\n============================================================\n")
cat("PDF CONSOLIDADO GERADO COM SUCESSO\n")
cat("============================================================\n")
cat("Pacote:        ", id_pacote, "\n")
cat("Questões:      ", nrow(base_tratada), "\n")
cat("Páginas finais:", info_final$pages, "\n")
cat("Arquivo:       ", arquivo_pdf_final, "\n")
cat("Auditoria:     ", arquivo_auditoria, "\n")
cat("============================================================\n")

shell.exec(normalizePath(DIR_SAIDA))
