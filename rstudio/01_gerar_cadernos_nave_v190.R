# ============================================================
# NAVE — EDITORAÇÃO V1.9.0
# SCHEMA CENTRAL + TRÊS CADERNOS + ANEXO PEDAGÓGICO V1
# ============================================================
#
# CADERNO DO ESTUDANTE
# - questão recortada;
# - duas colunas quando possível;
# - questão larga usa largura total;
# - habilidade e dificuldade;
# - nunca contém gabarito.
#
# CADERNO DO PROFESSOR
# - questão recortada;
# - metadados pedagógicos compactos;
# - duas colunas quando possível;
# - gabarito oficial junto da questão;
# - anexo pedagógico estrutural ao final.
#
# CADERNO DE GABARITOS
# - documento independente, sem recortes.
# ============================================================

pacotes <- c(
  "readr", "dplyr", "purrr", "stringr", "fs",
  "googledrive", "pdftools", "magick", "tibble", "png"
)

faltantes <- pacotes[
  !vapply(
    pacotes,
    requireNamespace,
    logical(1),
    quietly = TRUE
  )
]

if (length(faltantes)) {
  stop(
    "Dependências R ausentes. Instale manualmente: ",
    paste(faltantes, collapse = ", "),
    call. = FALSE
  )
}

library(readr)
library(dplyr)
library(purrr)
library(stringr)
library(fs)
library(googledrive)
library(pdftools)
library(magick)
library(tibble)
library(png)

# ------------------------------------------------------------
# CONFIGURAÇÃO
# ------------------------------------------------------------

SCHEMA_ESPERADO <- "NAVE_EDITORIAL_CENTRAL_V1"
DIR_PROJETO <- "C:/NAVE/NAVE_PACOTES_EDITORIAIS_V190"

DIR_CSV        <- path(DIR_PROJETO, "01_csv")
DIR_FONTES     <- path(DIR_PROJETO, "02_fontes")
DIR_PREVIEW    <- path(DIR_PROJETO, "03_recortes", "preview")
DIR_RECORTES   <- path(DIR_PROJETO, "03_recortes", "imagens")
DIR_PAGINAS    <- path(DIR_PROJETO, "03_recortes", "paginas")
DIR_SAIDA      <- path(DIR_PROJETO, "04_pdf_final")
DIR_AUDITORIA  <- path(DIR_PROJETO, "05_auditoria")

dir_create(c(
  DIR_PROJETO,
  DIR_CSV,
  DIR_FONTES,
  DIR_PREVIEW,
  DIR_RECORTES,
  DIR_PAGINAS,
  DIR_SAIDA,
  DIR_AUDITORIA
))

DPI_PREVIEW <- 120
DPI_SAIDA <- 360
DPI_RENDER_INICIAL <- 400
DPI_RENDER_RETRY <- 600
DPI_MINIMO_IMPRESSAO <- 300
DPI_FINAL <- DPI_RENDER_INICIAL

# A4 a 360 dpi. O tamanho físico final é sempre A4.
PAG_W <- round(8.2677165354 * DPI_SAIDA)
PAG_H <- round(11.692913386 * DPI_SAIDA)

MARGEM_X <- round(0.40 * DPI_SAIDA)
MARGEM_Y <- round(0.40 * DPI_SAIDA)
GUTTER   <- round(0.23 * DPI_SAIDA)
ESPACO_BLOCO <- round(0.13 * DPI_SAIDA)

# Compactação controlada para evitar páginas subutilizadas.
# Um bloco de largura total pode ser reduzido em até 15% quando isso
# permitir aproveitar a mesma página, sem forçar fonte excessivamente pequena.
MIN_FATOR_COMPACTACAO <- 0.85

COL_W <- floor(
  (PAG_W - 2 * MARGEM_X - GUTTER) / 2
)

FULL_W <- PAG_W - 2 * MARGEM_X

# Questões muito horizontais ficam melhores em largura total.
RAZAO_LARGA_MIN <- 1.25

# Duas colunas só são usadas quando a questão não precisar ser
# reduzida excessivamente em relação à largura que ocupava no PDF original.
# 0.88 = no máximo ~12% de redução física estimada.
MIN_ESCALA_FISICA_COL <- 0.88

FRACAO_LARGURA_COLUNA <- COL_W / PAG_W

ARQUIVO_CACHE_RECORTES <- path(
  DIR_PROJETO,
  "recortes_cache_v190.csv"
)

ARQUIVO_CACHE_LEGADO <- path(
  "C:/NAVE/NAVE_PACOTES_EDITORIAIS_V183",
  "recortes_cache.csv"
)

# ------------------------------------------------------------
# UTILITÁRIOS
# ------------------------------------------------------------

limpar_nome <- function(x) {
  x |>
    as.character() |>
    str_replace_all("[^A-Za-z0-9_-]+", "_") |>
    str_replace_all("_+", "_") |>
    str_remove("^_") |>
    str_remove("_$")
}

validar_colunas <- function(df, cols) {
  faltantes <- setdiff(cols, names(df))

  if (length(faltantes)) {
    stop(
      "Colunas ausentes: ",
      paste(faltantes, collapse = ", "),
      call. = FALSE
    )
  }
}

texto_seguro <- function(x) {
  if (is.null(x) || length(x) == 0 || is.na(x)) return("")
  str_squish(as.character(x))
}

quebrar_texto <- function(x, largura = 52) {
  x <- texto_seguro(x)
  if (!nzchar(x)) return(character())
  str_split(str_wrap(x, width = largura), "\n")[[1]]
}

extrair_id_drive <- function(x) {
  x <- trimws(x)

  padroes <- c(
    "/d/([A-Za-z0-9_-]+)",
    "[?&]id=([A-Za-z0-9_-]+)",
    "^([A-Za-z0-9_-]{20,})$"
  )

  for (p in padroes) {
    m <- regexec(p, x)
    r <- regmatches(x, m)[[1]]

    if (length(r) >= 2) {
      return(r[2])
    }
  }

  stop(
    "Não foi possível identificar o ID do arquivo no link informado.",
    call. = FALSE
  )
}

# ------------------------------------------------------------
# GOOGLE DRIVE
# ------------------------------------------------------------

baixar_pdf_drive <- function(id_drive, nome_publico) {
  destino <- path(
    DIR_FONTES,
    paste0(
      limpar_nome(nome_publico),
      "_",
      str_sub(id_drive, 1, 8),
      ".pdf"
    )
  )

  if (file_exists(destino)) {
    return(destino)
  }

  arq <- drive_get(as_id(id_drive))

  drive_download(
    arq,
    path = destino,
    overwrite = TRUE
  )

  destino
}

# ------------------------------------------------------------
# RENDERIZAÇÃO E RECORTE
# ------------------------------------------------------------

renderizar_pagina_png <- function(
  pdf,
  pagina,
  dpi,
  destino
) {
  pdf_convert(
    pdf = pdf,
    format = "png",
    pages = as.integer(pagina),
    filenames = destino,
    dpi = dpi,
    verbose = FALSE
  )

  destino
}

carregar_cache <- function() {
  if (!file_exists(ARQUIVO_CACHE_RECORTES)) {
    return(
      tibble(
        id_questao = character(),
        id_arquivo_drive = character(),
        pagina_pdf = integer(),
        crop_x = double(),
        crop_y = double(),
        crop_w = double(),
        crop_h = double()
      )
    )
  }

  read_csv(
    ARQUIVO_CACHE_RECORTES,
    show_col_types = FALSE
  )
}

formatar_habilidade_v190 <- function(x) {
  valor <- texto_seguro(x)
  if (!nzchar(valor)) return("")
  if (str_detect(valor, regex("^H", ignore_case = TRUE))) {
    return(str_to_upper(valor))
  }
  paste0("H", valor)
}

carregar_cache_legado <- function() {
  if (!file_exists(ARQUIVO_CACHE_LEGADO)) {
    return(tibble())
  }

  read_csv(
    ARQUIVO_CACHE_LEGADO,
    show_col_types = FALSE
  )
}

salvar_cache <- function(cache) {
  write_excel_csv(
    cache |>
      distinct(
        id_questao,
        id_arquivo_drive,
        pagina_pdf,
        .keep_all = TRUE
      ),
    ARQUIVO_CACHE_RECORTES,
    na = ""
  )
}

capturar_recorte_interativo <- function(
  png_preview,
  id_questao,
  id_arquivo_drive,
  pagina_pdf
) {
  img <- png::readPNG(png_preview)

  h <- dim(img)[1]
  w <- dim(img)[2]

  if (identical(Sys.info()[["sysname"]], "Windows")) {
    grDevices::windows(
      width = 10,
      height = 12
    )
  } else {
    grDevices::dev.new(
      width = 10,
      height = 12
    )
  }

  par(mar = c(0, 0, 2.2, 0))

  plot(
    c(0, w),
    c(0, h),
    type = "n",
    axes = FALSE,
    xlab = "",
    ylab = "",
    asp = 1,
    main = paste(
      id_questao,
      "— clique SUP. ESQ. e INF. DIR."
    )
  )

  rasterImage(
    img,
    0, 0,
    w, h
  )

  pontos <- locator(2)

  dev.off()

  if (
    is.null(pontos) ||
    length(pontos$x) != 2
  ) {
    stop(
      "Recorte cancelado para ",
      id_questao,
      call. = FALSE
    )
  }

  x1 <- min(pontos$x)
  x2 <- max(pontos$x)
  y1 <- min(pontos$y)
  y2 <- max(pontos$y)

  tibble(
    id_questao = id_questao,
    id_arquivo_drive = id_arquivo_drive,
    pagina_pdf = as.integer(pagina_pdf),
    crop_x = max(0, min(1, x1 / w)),
    crop_y = max(0, min(1, 1 - (y2 / h))),
    crop_w = max(0, min(1, (x2 - x1) / w)),
    crop_h = max(0, min(1, (y2 - y1) / h))
  )
}

obter_preview <- function(
  item,
  pdf_local
) {
  preview <- path(
    DIR_PREVIEW,
    paste0(
      limpar_nome(item$id_questao),
      "_p",
      item$pagina_pdf,
      ".png"
    )
  )

  if (!file_exists(preview)) {
    renderizar_pagina_png(
      pdf_local,
      item$pagina_pdf,
      DPI_PREVIEW,
      preview
    )
  }

  preview
}

obter_recorte <- function(
  item,
  pdf_local,
  cache,
  cache_legado,
  ignorar_cache = FALSE
) {
  vals <- suppressWarnings(
    c(
      as.numeric(item$crop_x),
      as.numeric(item$crop_y),
      as.numeric(item$crop_w),
      as.numeric(item$crop_h)
    )
  )

  if (
    !ignorar_cache &&
    length(vals) == 4 &&
    all(!is.na(vals)) &&
    vals[3] > 0 &&
    vals[4] > 0
  ) {
    return(
      tibble(
        id_questao = item$id_questao,
        id_arquivo_drive = item$id_arquivo_drive,
        pagina_pdf = as.integer(item$pagina_pdf),
        crop_x = vals[1],
        crop_y = vals[2],
        crop_w = vals[3],
        crop_h = vals[4]
      )
    )
  }

  if (!ignorar_cache) {
    hit <- cache |>
      filter(
        id_questao == item$id_questao,
        id_arquivo_drive == item$id_arquivo_drive,
        pagina_pdf == as.integer(item$pagina_pdf)
      ) |>
      slice_tail(n = 1)

    if (
      nrow(hit) == 1 &&
      all(!is.na(hit$crop_x)) &&
      hit$crop_w > 0 &&
      hit$crop_h > 0
    ) {
      return(hit)
    }

    # O cache V1.8.3 normalmente não possui fonte/página. Nesse caso,
    # a compatibilidade não pode ser comprovada e ele não é reutilizado.
    campos_legado <- c(
      "id_questao", "id_arquivo_drive", "pagina_pdf",
      "crop_x", "crop_y", "crop_w", "crop_h"
    )

    if (all(campos_legado %in% names(cache_legado))) {
      hit_legado <- cache_legado |>
        filter(
          id_questao == item$id_questao,
          id_arquivo_drive == item$id_arquivo_drive,
          as.integer(pagina_pdf) == as.integer(item$pagina_pdf)
        ) |>
        slice_tail(n = 1)

      if (
        nrow(hit_legado) == 1 &&
        all(!is.na(hit_legado$crop_x)) &&
        hit_legado$crop_w > 0 &&
        hit_legado$crop_h > 0
      ) {
        return(hit_legado |> select(all_of(campos_legado)))
      }
    }
  }

  preview <- obter_preview(
    item,
    pdf_local
  )

  capturar_recorte_interativo(
    preview,
    item$id_questao,
    item$id_arquivo_drive,
    item$pagina_pdf
  )
}

buscar_cache_recorte_v190 <- function(item, cache, cache_legado) {
  chave <- c("id_questao", "id_arquivo_drive", "pagina_pdf")
  hit <- if (all(chave %in% names(cache))) {
    cache |>
      filter(
        id_questao == item$id_questao,
        id_arquivo_drive == item$id_arquivo_drive,
        pagina_pdf == as.integer(item$pagina_pdf)
      ) |>
      slice_tail(n = 1)
  } else {
    tibble()
  }

  if (nrow(hit) == 1) {
    return(list(recorte = hit, origem = "CACHE_V190"))
  }

  campos_legado <- c(
    "id_questao", "id_arquivo_drive", "pagina_pdf",
    "crop_x", "crop_y", "crop_w", "crop_h"
  )
  if (!all(campos_legado %in% names(cache_legado))) return(NULL)

  hit_legado <- cache_legado |>
    filter(
      id_questao == item$id_questao,
      id_arquivo_drive == item$id_arquivo_drive,
      as.integer(pagina_pdf) == as.integer(item$pagina_pdf)
    ) |>
    slice_tail(n = 1)

  if (nrow(hit_legado) != 1) return(NULL)
  list(
    recorte = hit_legado |> select(all_of(campos_legado)),
    origem = "CACHE_V183_PROMOVIDO"
  )
}

recortar_questao <- function(
  pdf_local,
  pagina,
  recorte,
  id_questao,
  dpi_render = DPI_RENDER_INICIAL
) {
  png_pagina <- path(
    DIR_RECORTES,
    paste0(
      limpar_nome(id_questao),
      "_pagina.png"
    )
  )

  renderizar_pagina_png(
    pdf_local,
    pagina,
    dpi_render,
    png_pagina
  )

  img <- image_read(png_pagina)
  info <- image_info(img)

  x <- round(recorte$crop_x * info$width)
  y <- round(recorte$crop_y * info$height)
  w <- round(recorte$crop_w * info$width)
  h <- round(recorte$crop_h * info$height)

  x <- max(0, min(x, info$width - 1))
  y <- max(0, min(y, info$height - 1))

  w <- max(
    1,
    min(
      w,
      info$width - x
    )
  )

  h <- max(
    1,
    min(
      h,
      info$height - y
    )
  )

  crop <- image_crop(
    img,
    geometry_area(
      width = w,
      height = h,
      x_off = x,
      y_off = y
    ),
    repage = TRUE
  )

  saida <- path(
    DIR_RECORTES,
    paste0(
      limpar_nome(id_questao),
      "_recorte.png"
    )
  )

  image_write(
    crop,
    saida
  )

  saida
}

recorte_tem_conteudo <- function(
  arquivo_png
) {
  img <- image_read(arquivo_png) |>
    image_convert(colorspace = "gray") |>
    image_resize("64x64!")

  dados <- image_data(
    img,
    channels = "gray"
  )

  vals <- as.integer(dados)

  # proporção de pixels suficientemente escuros
  proporcao_tinta <- mean(vals < 242)

  is.finite(proporcao_tinta) &&
    proporcao_tinta >= 0.004
}

# ------------------------------------------------------------
# CRIAÇÃO DE BLOCOS
# ------------------------------------------------------------

criar_bloco_estudante <- function(
  item,
  recorte_png,
  largura
) {
  img <- image_read(recorte_png)
  info <- image_info(img)

  margem <- 18
  titulo_h <- 78

  alvo_w <- largura - 2 * margem

  escala <- alvo_w / info$width

  nova_w <- round(
    info$width * escala
  )

  nova_h <- round(
    info$height * escala
  )

  img <- image_resize(
    img,
    paste0(
      nova_w,
      "x",
      nova_h,
      "!"
    )
  )

  bloco_h <- titulo_h +
    nova_h +
    2 * margem

  bloco <- image_blank(
    width = largura,
    height = bloco_h,
    color = "white"
  )

  bloco <- image_annotate(
    bloco,
    paste0(
      "Questão ",
      item$ordem,
      "\n",
      formatar_habilidade_v190(item$habilidade),
      " · ",
      texto_seguro(item$dificuldade)
    ),
    size = round(24 * DPI_SAIDA / 200),
    gravity = "northwest",
    location = paste0(
      "+",
      margem,
      "+",
      margem
    )
  )

  bloco <- image_composite(
    bloco,
    img,
    offset = paste0(
      "+",
      margem,
      "+",
      margem + titulo_h
    ),
    operator = "over"
  )

  bloco
}

criar_bloco_professor <- function(
  item,
  recorte_png,
  largura
) {
  margem <- 18

  linhas <- c(
    paste0(
      "Questão ",
      item$ordem,
      "  ·  ",
      item$id_questao
    ),
    paste0(
      texto_seguro(item$area),
      " · ",
      texto_seguro(item$componente),
      " · ",
      texto_seguro(item$competencia),
      " · ",
      texto_seguro(item$habilidade)
    ),
    paste0(
      "Objeto: ",
      texto_seguro(item$objeto_principal)
    ),
    paste0(
      "Ação cognitiva: ",
      texto_seguro(item$acao_cognitiva)
    ),
    paste0(
      "Dificuldade: ",
      texto_seguro(item$dificuldade)
    ),
    paste0(
      "Função: ",
      texto_seguro(
        item$funcao_pedagogica
      )
    ),
    paste0(
      "Tempo estimado: ",
      texto_seguro(item$tempo_estimado_min),
      " min · Gabarito: ",
      texto_seguro(item$gabarito_oficial)
    ),
    paste0(
      "ENEM ",
      texto_seguro(item$ano),
      " · ",
      texto_seguro(item$edicao)
    ),
    paste0(
      "Fonte: ", texto_seguro(item$nome_publico_fonte),
      " · p. ", texto_seguro(item$pagina_pdf),
      " · ", texto_seguro(item$status_validacao),
      " · ", texto_seguro(item$maturidade_curadoria)
    )
  )

  largura_wrap <- if (largura <= COL_W) 48 else 95

  linhas_wrap <- unlist(
    lapply(
      linhas,
      quebrar_texto,
      largura = largura_wrap
    ),
    use.names = FALSE
  )

  fonte_meta <- if (largura <= COL_W) {
    round(17 * DPI_SAIDA / 200)
  } else {
    round(20 * DPI_SAIDA / 200)
  }
  linha_h <- if (largura <= COL_W) {
    round(25 * DPI_SAIDA / 200)
  } else {
    round(29 * DPI_SAIDA / 200)
  }

  meta_h <- max(
    1,
    length(linhas_wrap)
  ) * linha_h + 12

  img <- image_read(recorte_png)
  info <- image_info(img)

  alvo_w <- largura - 2 * margem
  escala <- alvo_w / info$width

  nova_w <- round(
    info$width * escala
  )

  nova_h <- round(
    info$height * escala
  )

  img <- image_resize(
    img,
    paste0(
      nova_w,
      "x",
      nova_h,
      "!"
    )
  )

  bloco_h <- margem +
    meta_h +
    nova_h +
    margem

  bloco <- image_blank(
    width = largura,
    height = bloco_h,
    color = "white"
  )

  y <- margem

  for (j in seq_along(linhas_wrap)) {
    bloco <- image_annotate(
      bloco,
      linhas_wrap[j],
      size = fonte_meta,
      gravity = "northwest",
      location = paste0(
        "+",
        margem,
        "+",
        y
      )
    )

    y <- y + linha_h
  }

  y <- y + 10

  bloco <- image_composite(
    bloco,
    img,
    offset = paste0(
      "+",
      margem,
      "+",
      y
    ),
    operator = "over"
  )

  bloco
}

# ------------------------------------------------------------
# PAGINAÇÃO INTELIGENTE
# ------------------------------------------------------------

novo_canvas <- function() {
  image_blank(
    width = PAG_W,
    height = PAG_H,
    color = "white"
  )
}

salvar_canvas <- function(
  canvas,
  prefixo,
  numero
) {
  arquivo <- path(
    DIR_PAGINAS,
    paste0(
      prefixo,
      "_",
      sprintf("%03d", numero),
      ".png"
    )
  )

  image_write(
    canvas,
    arquivo
  )

  arquivo
}

usar_largura_total <- function(
  item,
  recorte_png
) {
  info <- image_info(
    image_read(recorte_png)
  )

  razao <- info$width / info$height

  crop_w_norm <- suppressWarnings(
    as.numeric(
      if (
        "crop_w_layout" %in% names(item) &&
        !is.na(item$crop_w_layout) &&
        nzchar(as.character(item$crop_w_layout))
      ) {
        item$crop_w_layout
      } else {
        item$crop_w
      }
    )
  )

  # Se não houver crop_w confiável, adota postura conservadora:
  # questões largas/horizontais usam largura total.
  if (
    is.na(crop_w_norm) ||
    !is.finite(crop_w_norm) ||
    crop_w_norm <= 0
  ) {
    return(
      is.finite(razao) &&
      razao >= RAZAO_LARGA_MIN
    )
  }

  # Estimativa da escala física ao colocar o recorte em meia página.
  # Ex.: crop_w = 0,70 e coluna = ~0,44 da página:
  # escala ~0,63 -> fonte ficaria pequena demais.
  escala_fisica_col <-
    FRACAO_LARGURA_COLUNA /
    crop_w_norm

  horizontal_larga <-
    is.finite(razao) &&
    razao >= RAZAO_LARGA_MIN

  reduziria_demais <-
    is.finite(escala_fisica_col) &&
    escala_fisica_col <
      MIN_ESCALA_FISICA_COL

  horizontal_larga ||
    reduziria_demais
}

compactar_bloco_para_altura <- function(
  bloco,
  altura_disponivel,
  fator_minimo = MIN_FATOR_COMPACTACAO
) {
  info <- image_info(bloco)

  if (info$height <= altura_disponivel) {
    return(
      list(
        bloco = bloco,
        fator = 1
      )
    )
  }

  fator_necessario <-
    altura_disponivel /
    info$height

  if (
    !is.finite(fator_necessario) ||
    fator_necessario < fator_minimo
  ) {
    return(NULL)
  }

  fator <- min(
    1,
    fator_necessario * 0.995
  )

  novo_w <- max(
    1,
    floor(info$width * fator)
  )

  novo_h <- max(
    1,
    floor(info$height * fator)
  )

  bloco_reduzido <- image_resize(
    bloco,
    paste0(
      novo_w,
      "x",
      novo_h,
      "!"
    )
  )

  list(
    bloco = bloco_reduzido,
    fator = fator
  )
}


centralizar_x <- function(
  bloco,
  largura_area = FULL_W
) {
  info <- image_info(bloco)

  MARGEM_X +
    max(
      0,
      floor(
        (largura_area - info$width) / 2
      )
    )
}


montar_paginas <- function(
  itens,
  tipo = c(
    "estudante",
    "professor"
  )
) {
  tipo <- match.arg(tipo)

  prefixo <- paste0(
    "pagina_",
    tipo
  )

  antigos <- dir_ls(
    DIR_PAGINAS,
    regexp = paste0(
      "^",
      prefixo,
      "_.*\\.png$"
    ),
    fail = FALSE
  )

  if (length(antigos)) {
    file_delete(antigos)
  }

  arquivos_paginas <- character()

  canvas <- novo_canvas()
  numero_pagina <- 1

  y_esq <- MARGEM_Y
  y_dir <- MARGEM_Y

  pagina_tem_conteudo <- FALSE

  fechar_pagina <- function() {
    if (!pagina_tem_conteudo) {
      return(invisible(NULL))
    }

    arq <- salvar_canvas(
      canvas,
      prefixo,
      numero_pagina
    )

    arquivos_paginas <<- c(
      arquivos_paginas,
      arq
    )

    numero_pagina <<- numero_pagina + 1
    canvas <<- novo_canvas()
    y_esq <<- MARGEM_Y
    y_dir <<- MARGEM_Y
    pagina_tem_conteudo <<- FALSE

    invisible(NULL)
  }

  for (i in seq_len(nrow(itens))) {
    item <- itens[i, ]

    recorte_png <- item$arquivo_recorte

    full <- usar_largura_total(
      item,
      recorte_png
    )

    cat(
      sprintf(
        "  Layout %-12s | %s | crop_w=%.3f | %s\n",
        tipo,
        item$id_questao,
        as.numeric(item$crop_w_layout),
        if (full) "LARGURA TOTAL" else "2 COLUNAS"
      )
    )

    if (full) {
      bloco <- if (
        tipo == "estudante"
      ) {
        criar_bloco_estudante(
          item,
          recorte_png,
          FULL_W
        )
      } else {
        criar_bloco_professor(
          item,
          recorte_png,
          FULL_W
        )
      }

      y_atual <- max(
        y_esq,
        y_dir
      )

      limite_inferior <-
        PAG_H - MARGEM_Y

      altura_disponivel <-
        limite_inferior -
        y_atual

      ajuste <- compactar_bloco_para_altura(
        bloco,
        altura_disponivel
      )

      # Se não couber normalmente, mas couber com até 15% de redução,
      # aproveita a página atual. Esse é o caso típico de Q1 + Q2.
      if (is.null(ajuste)) {
        fechar_pagina()

        y_atual <- MARGEM_Y

        altura_disponivel <-
          limite_inferior -
          y_atual

        ajuste <- compactar_bloco_para_altura(
          bloco,
          altura_disponivel,
          fator_minimo = 0.70
        )

        if (is.null(ajuste)) {
          stop(
            "A questão ",
            item$id_questao,
            " não cabe nem em página inteira.",
            call. = FALSE
          )
        }
      }

      bloco_final <- ajuste$bloco
      fator_usado <- ajuste$fator

      h <- image_info(
        bloco_final
      )$height

      x_full <- centralizar_x(
        bloco_final
      )

      cat(
        sprintf(
          "    compactação largura total: %.1f%%\n",
          fator_usado * 100
        )
      )

      canvas <- image_composite(
        canvas,
        bloco_final,
        offset = paste0(
          "+",
          x_full,
          "+",
          y_atual
        ),
        operator = "over"
      )

      y_novo <- y_atual +
        h +
        ESPACO_BLOCO

      y_esq <- y_novo
      y_dir <- y_novo
      pagina_tem_conteudo <- TRUE

      next
    }

    bloco <- if (
      tipo == "estudante"
    ) {
      criar_bloco_estudante(
        item,
        recorte_png,
        COL_W
      )
    } else {
      criar_bloco_professor(
        item,
        recorte_png,
        COL_W
      )
    }

    h <- image_info(bloco)$height

    # tenta coluna com menor ocupação
    preferencia <- if (
      y_esq <= y_dir
    ) "esq" else "dir"

    cabe_esq <- (
      y_esq + h <=
      PAG_H - MARGEM_Y
    )

    cabe_dir <- (
      y_dir + h <=
      PAG_H - MARGEM_Y
    )

    coluna <- NULL

    if (
      preferencia == "esq" &&
      cabe_esq
    ) {
      coluna <- "esq"
    } else if (
      preferencia == "dir" &&
      cabe_dir
    ) {
      coluna <- "dir"
    } else if (cabe_esq) {
      coluna <- "esq"
    } else if (cabe_dir) {
      coluna <- "dir"
    }

    if (is.null(coluna)) {
      # Tenta compactação leve na coluna menos ocupada antes de abrir nova página.
      if (y_esq <= y_dir) {
        coluna_teste <- "esq"
        y_teste <- y_esq
      } else {
        coluna_teste <- "dir"
        y_teste <- y_dir
      }

      altura_disponivel <-
        PAG_H - MARGEM_Y - y_teste

      ajuste_col <- compactar_bloco_para_altura(
        bloco,
        altura_disponivel,
        fator_minimo = 0.90
      )

      if (!is.null(ajuste_col)) {
        bloco <- ajuste_col$bloco
        h <- image_info(bloco)$height
        coluna <- coluna_teste

        cat(
          sprintf(
            "    compactação coluna: %.1f%%\n",
            ajuste_col$fator * 100
          )
        )
      } else {
        fechar_pagina()
        coluna <- "esq"
      }
    }

    if (coluna == "esq") {
      x <- MARGEM_X
      y <- y_esq

      canvas <- image_composite(
        canvas,
        bloco,
        offset = paste0(
          "+",
          x,
          "+",
          y
        ),
        operator = "over"
      )

      y_esq <- y +
        h +
        ESPACO_BLOCO
    } else {
      x <- MARGEM_X +
        COL_W +
        GUTTER

      y <- y_dir

      canvas <- image_composite(
        canvas,
        bloco,
        offset = paste0(
          "+",
          x,
          "+",
          y
        ),
        operator = "over"
      )

      y_dir <- y +
        h +
        ESPACO_BLOCO
    }

    pagina_tem_conteudo <- TRUE
  }

  fechar_pagina()

  arquivos_paginas
}

gravar_pdf_paginas <- function(
  arquivos_paginas,
  arquivo_pdf
) {
  if (!length(arquivos_paginas)) {
    stop(
      "Nenhuma página foi gerada para ",
      arquivo_pdf,
      call. = FALSE
    )
  }

  # V1.8.1:
  # Cada PNG vira primeiro um PDF de UMA página.
  # Depois pdftools::pdf_combine() une esses PDFs.
  # Isso elimina a repetição de frames observada quando o magick
  # gravava diretamente um vetor de imagens em um único PDF.

  dir_paginas_pdf <- path(
    DIR_PAGINAS,
    paste0(
      "pdf_",
      limpar_nome(
        path_ext_remove(
          path_file(arquivo_pdf)
        )
      )
    )
  )

  dir_create(dir_paginas_pdf)

  antigos <- dir_ls(
    dir_paginas_pdf,
    regexp = "\\.pdf$",
    fail = FALSE
  )

  if (length(antigos)) {
    file_delete(antigos)
  }

  pdfs_unitarios <- character(
    length(arquivos_paginas)
  )

  for (i in seq_along(arquivos_paginas)) {
    img <- image_read(
      arquivos_paginas[i]
    )

    # Se um PNG tiver mais de um frame por qualquer motivo,
    # mantém explicitamente apenas o primeiro.
    if (length(img) > 1) {
      img <- img[1]
    }

    pdf_unitario <- path(
      dir_paginas_pdf,
      paste0(
        "pagina_",
        sprintf("%03d", i),
        ".pdf"
      )
    )

    image_write(
      img,
      path = pdf_unitario,
      format = "pdf",
      density = DPI_SAIDA
    )

    paginas_unitarias <-
      pdftools::pdf_info(
        pdf_unitario
      )$pages

    if (paginas_unitarias != 1) {
      stop(
        "A página intermediária ",
        i,
        " gerou ",
        paginas_unitarias,
        " páginas. Esperado: 1.",
        call. = FALSE
      )
    }

    pdfs_unitarios[i] <-
      pdf_unitario
  }

  if (file_exists(arquivo_pdf)) {
    file_delete(arquivo_pdf)
  }

  pdftools::pdf_combine(
    pdfs_unitarios,
    output = arquivo_pdf
  )

  paginas_finais <-
    pdftools::pdf_info(
      arquivo_pdf
    )$pages

  esperadas <- length(
    arquivos_paginas
  )

  if (paginas_finais != esperadas) {
    stop(
      "AUDITORIA DE PAGINAÇÃO: PDF final tem ",
      paginas_finais,
      " páginas, mas eram esperadas ",
      esperadas,
      ".",
      call. = FALSE
    )
  }

  arquivo_pdf
}


# ------------------------------------------------------------
# CONTRATO CENTRAL, QUALIDADE E DOCUMENTOS COMPLEMENTARES
# ------------------------------------------------------------

normalizar_booleano <- function(x) {
  tolower(str_trim(as.character(x))) %in% c("true", "sim", "1")
}

validar_entrada_central_v190 <- function(base) {
  obrigatorias <- c(
    "schema_version", "id_envio", "id_projeto", "id_sequencia",
    "titulo", "descricao", "quantidade_questoes", "ordem", "id_questao",
    "area", "componente", "competencia", "habilidade", "objeto_principal",
    "acao_cognitiva", "dificuldade", "dificuldade_faixa",
    "funcao_pedagogica", "tempo_estimado_min", "gabarito_oficial",
    "ano", "edicao", "colecao_origem", "nome_publico_fonte", "url_pdf",
    "id_arquivo_drive", "pagina_pdf", "disponibilidade_fonte",
    "pagina_localizada", "motivo_fonte", "status_validacao",
    "maturidade_curadoria", "liberacao_editorial", "crop_x", "crop_y",
    "crop_w", "crop_h", "status_recorte", "trecho_inicial",
    "fontes_incompletas", "gabaritos_incompletos", "itens_nao_liberados",
    "status_pacote", "exportado_em", "exportado_por"
  )
  validar_colunas(base, obrigatorias)
  if (!identical(names(base), obrigatorias)) {
    stop(
      "O CSV deve conter exatamente as 45 colunas do schema central, na ordem contratada.",
      call. = FALSE
    )
  }

  versao_linhas <- str_trim(as.character(base$schema_version))
  if (any(is.na(versao_linhas) | !nzchar(versao_linhas))) {
    stop("schema_version é obrigatório em todas as linhas.", call. = FALSE)
  }
  versoes <- unique(versao_linhas)
  if (length(versoes) != 1 || versoes[[1]] != SCHEMA_ESPERADO) {
    stop(
      "schema_version inválido. Esperado exclusivamente: ",
      SCHEMA_ESPERADO,
      call. = FALSE
    )
  }

  base <- base |>
    mutate(
      ordem = suppressWarnings(as.integer(ordem)),
      pagina_pdf = suppressWarnings(as.integer(pagina_pdf)),
      quantidade_questoes = suppressWarnings(as.integer(quantidade_questoes)),
      id_arquivo_drive = as.character(id_arquivo_drive),
      gabarito_oficial = str_to_upper(str_trim(gabarito_oficial)),
      disponibilidade_fonte = normalizar_booleano(disponibilidade_fonte),
      pagina_localizada = normalizar_booleano(pagina_localizada)
    ) |>
    arrange(ordem)

  exigir_unico <- function(campo) {
    valores <- unique(base[[campo]])
    valores <- valores[!is.na(valores) & nzchar(str_trim(as.character(valores)))]
    if (length(valores) != 1) {
      stop("O CSV deve possuir exatamente um ", campo, ".", call. = FALSE)
    }
  }
  invisible(lapply(c("id_envio", "id_projeto", "id_sequencia"), exigir_unico))

  if (!identical(base$ordem, seq_len(nrow(base)))) {
    stop("A ordem deve ser contínua de 1 a N.", call. = FALSE)
  }
  if (anyDuplicated(base$id_questao)) {
    duplicados <- unique(base$id_questao[duplicated(base$id_questao)])
    stop("IDs de questão duplicados: ", paste(duplicados, collapse = ", "), call. = FALSE)
  }
  if (any(is.na(base$id_questao) | !nzchar(str_trim(base$id_questao)))) {
    stop("id_questao é obrigatório em todas as linhas.", call. = FALSE)
  }
  quantidades <- unique(base$quantidade_questoes)
  if (length(quantidades) != 1 || is.na(quantidades[[1]]) || quantidades[[1]] != nrow(base)) {
    stop("quantidade_questoes diverge do número de linhas.", call. = FALSE)
  }
  invalidos <- base |> filter(!gabarito_oficial %in% LETTERS[1:5])
  if (nrow(invalidos)) {
    stop("Gabarito oficial inválido: ", paste(invalidos$id_questao, collapse = ", "), call. = FALSE)
  }
  paginas_invalidas <- base |> filter(is.na(pagina_pdf) | pagina_pdf < 1)
  if (nrow(paginas_invalidas)) {
    stop("pagina_pdf ausente ou inválida: ", paste(paginas_invalidas$id_questao, collapse = ", "), call. = FALSE)
  }
  fontes_invalidas <- base |> filter(!disponibilidade_fonte | !pagina_localizada)
  if (nrow(fontes_invalidas)) {
    stop("Fonte ou página não disponível: ", paste(fontes_invalidas$id_questao, collapse = ", "), call. = FALSE)
  }
  ids_drive_ausentes <- base |> filter(is.na(id_arquivo_drive) | !nzchar(id_arquivo_drive))
  if (nrow(ids_drive_ausentes)) {
    stop("Fonte sem id_arquivo_drive utilizável: ", paste(ids_drive_ausentes$id_questao, collapse = ", "), call. = FALSE)
  }
  nao_liberados <- base |>
    filter(!liberacao_editorial %in% c("Liberada", "Liberada com revisão"))
  if (nrow(nao_liberados)) {
    stop(
      "CSV não está apto para saída FINAL. Itens não liberados: ",
      paste(nao_liberados$id_questao, collapse = ", "),
      call. = FALSE
    )
  }

  base
}

avaliar_qualidade_dimensoes_v190 <- function(
  largura_px,
  altura_px,
  largura_layout_px,
  rerenderizada = FALSE,
  vetorial_preservada = FALSE
) {
  if (isTRUE(vetorial_preservada)) {
    return(tibble(
      largura_px = largura_px,
      altura_px = altura_px,
      largura_impressao_cm = largura_layout_px / DPI_SAIDA * 2.54,
      altura_impressao_cm = NA_real_,
      dpi_efetivo_x = Inf,
      dpi_efetivo_y = Inf,
      dpi_efetivo_min = Inf,
      status_qualidade_imagem = "VETORIAL_PRESERVADA"
    ))
  }

  largura_pol <- largura_layout_px / DPI_SAIDA
  altura_pol <- largura_pol * altura_px / largura_px
  dpi_x <- largura_px / largura_pol
  dpi_y <- altura_px / altura_pol
  dpi_min <- min(dpi_x, dpi_y)
  status <- if (dpi_min < DPI_MINIMO_IMPRESSAO) {
    "ABAIXO_300_DPI"
  } else if (isTRUE(rerenderizada)) {
    "RENDERIZADA_NOVAMENTE"
  } else {
    "OK"
  }

  tibble(
    largura_px = as.integer(largura_px),
    altura_px = as.integer(altura_px),
    largura_impressao_cm = largura_pol * 2.54,
    altura_impressao_cm = altura_pol * 2.54,
    dpi_efetivo_x = dpi_x,
    dpi_efetivo_y = dpi_y,
    dpi_efetivo_min = dpi_min,
    status_qualidade_imagem = status
  )
}

avaliar_qualidade_arquivo_v190 <- function(
  arquivo,
  largura_layout_px,
  rerenderizada = FALSE
) {
  info <- image_info(image_read(arquivo))[1, ]
  avaliar_qualidade_dimensoes_v190(
    info$width,
    info$height,
    largura_layout_px,
    rerenderizada = rerenderizada,
    vetorial_preservada = FALSE
  )
}

montar_tabelas_anexo_v190 <- function(base) {
  list(
    visao_geral = list(
      quantidade = nrow(base),
      areas = sort(unique(base$area)),
      componentes = sort(unique(base$componente))
    ),
    habilidades = base |> count(habilidade, name = "quantidade") |> arrange(habilidade),
    dificuldades = base |> count(dificuldade, name = "quantidade") |> arrange(dificuldade),
    funcoes = base |> count(funcao_pedagogica, name = "quantidade") |> arrange(funcao_pedagogica),
    objetos = base |> count(objeto_principal, name = "quantidade") |> arrange(objeto_principal),
    competencias = base |>
      count(area, componente, competencia, name = "quantidade") |>
      arrange(area, componente, competencia),
    indice = base |>
      select(
        ordem, id_questao, componente, competencia, habilidade,
        objeto_principal, dificuldade, funcao_pedagogica, gabarito_oficial
      ) |>
      arrange(ordem)
  )
}

criar_paginas_texto_v190 <- function(linhas, prefixo, titulo) {
  por_pagina <- 46
  grupos <- split(linhas, ceiling(seq_along(linhas) / por_pagina))
  if (!length(grupos)) grupos <- list(character())

  map2_chr(grupos, seq_along(grupos), function(grupo, numero) {
    canvas <- novo_canvas()
    texto <- paste(c(titulo, "", grupo), collapse = "\n")
    canvas <- image_annotate(
      canvas,
      texto,
      size = round(18 * DPI_SAIDA / 200),
      gravity = "northwest",
      location = paste0("+", MARGEM_X, "+", MARGEM_Y)
    )
    salvar_canvas(canvas, prefixo, numero)
  })
}

criar_paginas_gabaritos_v190 <- function(base) {
  linhas <- montar_linhas_gabaritos_v190(base)
  criar_paginas_texto_v190(linhas, "pagina_gabaritos", "GABARITO")
}

montar_linhas_gabaritos_v190 <- function(base) {
  sprintf(
    "%d — %-24s — %s",
    base$ordem,
    base$id_questao,
    base$gabarito_oficial
  )
}

criar_paginas_anexo_v190 <- function(base) {
  tab <- montar_tabelas_anexo_v190(base)
  formatar <- function(df, campos) {
    apply(df[, campos, drop = FALSE], 1, paste, collapse = " · ")
  }
  linhas <- c(
    paste0("Quantidade total: ", tab$visao_geral$quantidade),
    paste0("Áreas: ", paste(tab$visao_geral$areas, collapse = ", ")),
    paste0("Componentes: ", paste(tab$visao_geral$componentes, collapse = ", ")),
    "", "DISTRIBUIÇÃO POR HABILIDADE",
    formatar(tab$habilidades, c("habilidade", "quantidade")),
    "", "DISTRIBUIÇÃO POR DIFICULDADE",
    formatar(tab$dificuldades, c("dificuldade", "quantidade")),
    "", "DISTRIBUIÇÃO POR FUNÇÃO PEDAGÓGICA",
    formatar(tab$funcoes, c("funcao_pedagogica", "quantidade")),
    "", "DISTRIBUIÇÃO POR OBJETO DO CONHECIMENTO",
    formatar(tab$objetos, c("objeto_principal", "quantidade")),
    "", "COMPETÊNCIAS CONTEMPLADAS",
    formatar(tab$competencias, c("area", "componente", "competencia", "quantidade")),
    "", "ÍNDICE PEDAGÓGICO",
    formatar(
      tab$indice,
      c(
        "ordem", "id_questao", "componente", "competencia", "habilidade",
        "objeto_principal", "dificuldade", "funcao_pedagogica", "gabarito_oficial"
      )
    )
  )
  criar_paginas_texto_v190(linhas, "pagina_anexo", "ANEXO PEDAGÓGICO V1")
}

# O pipeline V1.9.0 ainda usa composição bitmap do Magick. Preservação
# vetorial exigirá um compositor PDF vetorial futuro; nunca é presumida.

executar_nave_v190 <- function(link_csv = NULL) {
  cat("\nNAVE — EDITORAÇÃO V1.9.0\n")
  cat("Schema central, impressão >= 300 dpi e três cadernos\n\n")

  drive_auth()
  if (is.null(link_csv)) {
    link_csv <- readline("Cole o link do CSV editorial central: ")
  }
  id_csv <- extrair_id_drive(link_csv)
  arquivo_csv <- path(
    DIR_CSV,
    paste0("pacote_central_", format(Sys.time(), "%Y%m%d_%H%M%S"), ".csv")
  )
  drive_download(as_id(id_csv), path = arquivo_csv, overwrite = TRUE)

  base <- read_csv(
    arquivo_csv,
    show_col_types = FALSE,
    locale = locale(encoding = "UTF-8"),
    na = c("", "NA", "N/A")
  )
  base <- validar_entrada_central_v190(base)

  id_projeto <- unique(base$id_projeto)[[1]]
  projeto_nome <- limpar_nome(id_projeto)

  fontes <- base |>
    transmute(
      id_arquivo_drive = as.character(id_arquivo_drive),
      nome_fonte = if_else(
        nzchar(nome_publico_fonte),
        nome_publico_fonte,
        paste(area, colecao_origem, sep = "_")
      )
    ) |>
    distinct(id_arquivo_drive, .keep_all = TRUE) |>
    mutate(
      caminho_pdf = map2_chr(id_arquivo_drive, nome_fonte, baixar_pdf_drive)
    )

  if (anyDuplicated(fontes$id_arquivo_drive)) {
    stop("Mapa de fontes contém IDs duplicados.", call. = FALSE)
  }

  base_proc <- base |>
    left_join(
      fontes |> select(id_arquivo_drive, caminho_pdf),
      by = "id_arquivo_drive"
    )

  if (nrow(base_proc) != nrow(base) || any(is.na(base_proc$caminho_pdf))) {
    stop("Vínculo com PDFs alterou ou deixou incompleta a base.", call. = FALSE)
  }

  cache <- carregar_cache()
  cache_legado <- carregar_cache_legado()
  arquivos_recortes <- character(nrow(base_proc))
  crop_x_layout <- crop_y_layout <- crop_w_layout <- crop_h_layout <-
    rep(NA_real_, nrow(base_proc))
  auditoria <- vector("list", nrow(base_proc))

  for (i in seq_len(nrow(base_proc))) {
    item <- base_proc[i, ]
    recorte <- obter_recorte(
      item,
      item$caminho_pdf,
      cache,
      cache_legado
    )
    arquivo_recorte <- recortar_questao(
      item$caminho_pdf,
      item$pagina_pdf,
      recorte,
      item$id_questao,
      DPI_RENDER_INICIAL
    )

    if (!recorte_tem_conteudo(arquivo_recorte)) {
      stop("Recorte sem conteúdo para ", item$id_questao, ".", call. = FALSE)
    }

    largura_layout <- if (usar_largura_total(item, arquivo_recorte)) FULL_W else COL_W
    qualidade <- avaliar_qualidade_arquivo_v190(
      arquivo_recorte,
      largura_layout,
      rerenderizada = FALSE
    )

    if (qualidade$dpi_efetivo_min < DPI_MINIMO_IMPRESSAO) {
      arquivo_recorte <- recortar_questao(
        item$caminho_pdf,
        item$pagina_pdf,
        recorte,
        item$id_questao,
        DPI_RENDER_RETRY
      )
      qualidade <- avaliar_qualidade_arquivo_v190(
        arquivo_recorte,
        largura_layout,
        rerenderizada = TRUE
      )
    }

    if (qualidade$dpi_efetivo_min < DPI_MINIMO_IMPRESSAO) {
      qualidade$status_qualidade_imagem <- "FONTE_INSUFICIENTE"
    }

    cache <- bind_rows(
      cache |>
        filter(
          !(id_questao == item$id_questao &
            id_arquivo_drive == item$id_arquivo_drive &
            pagina_pdf == as.integer(item$pagina_pdf))
        ),
      recorte
    )
    salvar_cache(cache)

    arquivos_recortes[i] <- arquivo_recorte
    crop_x_layout[i] <- recorte$crop_x
    crop_y_layout[i] <- recorte$crop_y
    crop_w_layout[i] <- recorte$crop_w
    crop_h_layout[i] <- recorte$crop_h
    auditoria[[i]] <- bind_cols(
      tibble(
        ordem = item$ordem,
        id_questao = item$id_questao,
        id_arquivo_drive = item$id_arquivo_drive,
        pagina_pdf = item$pagina_pdf,
        crop_x = recorte$crop_x,
        crop_y = recorte$crop_y,
        crop_w = recorte$crop_w,
        crop_h = recorte$crop_h,
        status_recorte_origem = item$status_recorte,
        arquivo_recorte = arquivo_recorte,
        preservacao_vetorial = FALSE
      ),
      qualidade
    )
  }

  aud <- bind_rows(auditoria) |> arrange(ordem)
  arquivo_auditoria <- path(
    DIR_AUDITORIA,
    paste0("auditoria_recortes_", projeto_nome, "_v190.csv")
  )
  write_excel_csv(aud, arquivo_auditoria, na = "")

  qualidade_insuficiente <- aud |>
    filter(dpi_efetivo_min < DPI_MINIMO_IMPRESSAO)
  if (nrow(qualidade_insuficiente)) {
    stop(
      "Geração FINAL bloqueada: resolução efetiva abaixo de 300 dpi: ",
      paste(qualidade_insuficiente$id_questao, collapse = ", "),
      ". Consulte ", arquivo_auditoria,
      call. = FALSE
    )
  }

  base_layout <- base_proc |>
    mutate(
      arquivo_recorte = arquivos_recortes,
      crop_x_layout = crop_x_layout,
      crop_y_layout = crop_y_layout,
      crop_w_layout = crop_w_layout,
      crop_h_layout = crop_h_layout
    ) |>
    arrange(ordem)

  if (nrow(base_layout) != nrow(base) || anyDuplicated(base_layout$id_questao)) {
    stop("Auditoria de layout detectou perda ou duplicação de questões.", call. = FALSE)
  }

  paginas_estudante <- montar_paginas(base_layout, tipo = "estudante")
  paginas_professor <- c(
    montar_paginas(base_layout, tipo = "professor"),
    criar_paginas_anexo_v190(base_layout)
  )
  paginas_gabaritos <- criar_paginas_gabaritos_v190(base_layout)

  arquivo_estudante <- path(
    DIR_SAIDA,
    paste0("NAVE_", projeto_nome, "_CADERNO_ESTUDANTE_V190.pdf")
  )
  arquivo_professor <- path(
    DIR_SAIDA,
    paste0("NAVE_", projeto_nome, "_CADERNO_PROFESSOR_V190.pdf")
  )
  arquivo_gabaritos <- path(
    DIR_SAIDA,
    paste0("NAVE_", projeto_nome, "_CADERNO_GABARITOS_V190.pdf")
  )

  gravar_pdf_paginas(paginas_estudante, arquivo_estudante)
  gravar_pdf_paginas(paginas_professor, arquivo_professor)
  gravar_pdf_paginas(paginas_gabaritos, arquivo_gabaritos)

  list(
    id_projeto = id_projeto,
    quantidade = nrow(base_layout),
    caderno_estudante = arquivo_estudante,
    caderno_professor = arquivo_professor,
    caderno_gabaritos = arquivo_gabaritos,
    auditoria = arquivo_auditoria,
    dpi_saida = DPI_SAIDA,
    dpi_minimo = min(aud$dpi_efetivo_min)
  )
}


fixture_editorial_central_v190 <- function(n = 4) {
  tibble(
    schema_version = rep(SCHEMA_ESPERADO, n),
    id_envio = rep("ENV_FIXTURE", n),
    id_projeto = rep("PEC_FIXTURE", n),
    id_sequencia = rep("SEQ_FIXTURE", n),
    titulo = rep("Fixture multiarea", n),
    descricao = rep("Teste", n),
    quantidade_questoes = rep(n, n),
    ordem = seq_len(n),
    id_questao = paste0("Q", seq_len(n)),
    area = rep(c("CN", "CH", "LC", "MT"), length.out = n),
    componente = rep(c("Química", "História", "Língua Portuguesa", "Matemática"), length.out = n),
    competencia = paste0("C", seq_len(n)),
    habilidade = paste0("H", seq_len(n)),
    objeto_principal = paste0("Objeto ", seq_len(n)),
    acao_cognitiva = rep("Analisar", n),
    dificuldade = rep(c("Fácil", "Média", "Difícil", "Média"), length.out = n),
    dificuldade_faixa = rep(0.5, n),
    funcao_pedagogica = rep(c("Introdução", "Consolidação"), length.out = n),
    tempo_estimado_min = rep(3, n),
    gabarito_oficial = rep(c("A", "B", "C", "D"), length.out = n),
    ano = rep("2024", n),
    edicao = rep("Regular", n),
    colecao_origem = rep("ENEM 2024", n),
    nome_publico_fonte = rep("ENEM 2024", n),
    url_pdf = rep("https://drive.google.com/file/d/FONTE/view", n),
    id_arquivo_drive = rep("FONTE", n),
    pagina_pdf = seq_len(n) + 10L,
    disponibilidade_fonte = rep(TRUE, n),
    pagina_localizada = rep(TRUE, n),
    motivo_fonte = rep("", n),
    status_validacao = rep("Homologada", n),
    maturidade_curadoria = rep("Homologada", n),
    liberacao_editorial = rep("Liberada", n),
    crop_x = rep(NA_real_, n),
    crop_y = rep(NA_real_, n),
    crop_w = rep(NA_real_, n),
    crop_h = rep(NA_real_, n),
    status_recorte = rep("", n),
    trecho_inicial = rep("Trecho", n),
    fontes_incompletas = rep(0, n),
    gabaritos_incompletos = rep(0, n),
    itens_nao_liberados = rep(0, n),
    status_pacote = rep("Preparado", n),
    exportado_em = rep("2026-08-15T17:05:00Z", n),
    exportado_por = rep("fixture@nave", n)
  )
}

executar_testes_estruturais_v190 <- function() {
  deve_falhar <- function(expr, padrao) {
    erro <- tryCatch({ force(expr); NULL }, error = identity)
    stopifnot(inherits(erro, "error"), grepl(padrao, conditionMessage(erro)))
  }

  base <- fixture_editorial_central_v190()
  validada <- validar_entrada_central_v190(base)
  stopifnot(nrow(validada) == 4, identical(validada$ordem, 1:4)) # A, I-M

  ruim <- base; ruim$schema_version <- "OUTRO"
  deve_falhar(validar_entrada_central_v190(ruim), "schema_version") # B
  ruim <- base; ruim$ordem[2] <- 3L
  deve_falhar(validar_entrada_central_v190(ruim), "ordem") # C
  ruim <- base; ruim$id_questao[2] <- ruim$id_questao[1]
  deve_falhar(validar_entrada_central_v190(ruim), "duplicados") # D
  ruim <- base; ruim$gabarito_oficial[1] <- "X"
  deve_falhar(validar_entrada_central_v190(ruim), "Gabarito") # E
  ruim <- base; ruim$liberacao_editorial[1] <- "Aguardando validação"
  deve_falhar(validar_entrada_central_v190(ruim), "não liberados") # F
  ruim <- base; ruim$disponibilidade_fonte[1] <- FALSE
  deve_falhar(validar_entrada_central_v190(ruim), "Fonte") # G
  ruim <- base; ruim$pagina_pdf[1] <- NA_integer_
  deve_falhar(validar_entrada_central_v190(ruim), "pagina_pdf") # H

  estudante <- paste(deparse(body(criar_bloco_estudante)), collapse = " ")
  professor <- paste(deparse(body(criar_bloco_professor)), collapse = " ")
  stopifnot(!grepl("gabarito_oficial", estudante)) # N
  indicadores <- c(
    "area", "componente", "competencia", "habilidade", "objeto_principal",
    "acao_cognitiva", "dificuldade", "funcao_pedagogica",
    "tempo_estimado_min", "gabarito_oficial", "ano", "edicao"
  )
  stopifnot(all(vapply(indicadores, grepl, logical(1), x = professor))) # O
  stopifnot(grepl("1.*Q1.*A", montar_linhas_gabaritos_v190(base)[1])) # P

  anexo <- montar_tabelas_anexo_v190(base)
  stopifnot(
    anexo$visao_geral$quantidade == 4,
    sum(anexo$habilidades$quantidade) == 4,
    sum(anexo$dificuldades$quantidade) == 4,
    nrow(anexo$indice) == 4
  ) # Q

  item <- base[1, ]
  cache_novo <- tibble(
    id_questao = "Q1", id_arquivo_drive = "FONTE", pagina_pdf = 11L,
    crop_x = 0.1, crop_y = 0.1, crop_w = 0.8, crop_h = 0.3
  )
  stopifnot(buscar_cache_recorte_v190(item, cache_novo, tibble())$origem == "CACHE_V190") # R
  legado_ok <- cache_novo
  stopifnot(buscar_cache_recorte_v190(item, tibble(), legado_ok)$origem == "CACHE_V183_PROMOVIDO")
  legado_ruim <- legado_ok; legado_ruim$pagina_pdf <- 99L
  stopifnot(is.null(buscar_cache_recorte_v190(item, tibble(), legado_ruim))) # S

  q_acima <- avaliar_qualidade_dimensoes_v190(3100, 1550, 3600)
  q_exata <- avaliar_qualidade_dimensoes_v190(3000, 1500, 3600)
  q_abaixo <- avaliar_qualidade_dimensoes_v190(2900, 1450, 3600)
  q_redimensionada <- avaliar_qualidade_dimensoes_v190(3000, 1500, 4000)
  q_retry <- avaliar_qualidade_dimensoes_v190(4000, 2000, 3600, rerenderizada = TRUE)
  q_vetor <- avaliar_qualidade_dimensoes_v190(1, 1, 3600, vetorial_preservada = TRUE)
  stopifnot(
    q_acima$dpi_efetivo_min > 300,
    abs(q_exata$dpi_efetivo_min - 300) < 1e-9,
    q_abaixo$status_qualidade_imagem == "ABAIXO_300_DPI",
    q_redimensionada$dpi_efetivo_min < 300,
    q_retry$status_qualidade_imagem == "RENDERIZADA_NOVAMENTE",
    q_vetor$status_qualidade_imagem == "VETORIAL_PRESERVADA"
  )

  message("Testes estruturais V1.9.0: OK")
  invisible(TRUE)
}


if (identical(Sys.getenv("NAVE_V190_SELF_TEST"), "1")) {
  executar_testes_estruturais_v190()
} else if (identical(Sys.getenv("NAVE_V190_NO_AUTO_RUN"), "")) {
  executar_nave_v190()
}
