# ============================================================
# NAVE — EDITORAÇÃO V1.8.3
# RECORTE + PAGINAÇÃO INTELIGENTE EM DUAS COLUNAS
# ============================================================
#
# CADERNO DO ESTUDANTE
# - questão recortada;
# - duas colunas quando possível;
# - questão larga usa largura total;
# - gabarito final.
#
# CADERNO DO PROFESSOR
# - questão recortada;
# - metadados pedagógicos compactos;
# - duas colunas quando possível;
# - gabarito junto da questão.
#
# CORREÇÕES DA V1.8
# - elimina a triplicação de páginas da V1.7;
# - aproveita melhor o A4;
# - permite várias questões por página;
# - detecta recorte praticamente vazio;
# - reutiliza cache de recortes;
# - força novo recorte quando o cache produzir imagem vazia.
# ============================================================

pacotes <- c(
  "readr", "dplyr", "purrr", "stringr", "fs",
  "googledrive", "pdftools", "magick", "tibble", "png"
)

instalar_se_necessario <- function(p) {
  if (!requireNamespace(p, quietly = TRUE)) {
    install.packages(p)
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
library(magick)
library(tibble)
library(png)

# ------------------------------------------------------------
# CONFIGURAÇÃO
# ------------------------------------------------------------

DIR_PROJETO <- "C:/NAVE/NAVE_PACOTES_EDITORIAIS_V183"

DIR_CSV        <- path(DIR_PROJETO, "01_csv")
DIR_FONTES     <- path(DIR_PROJETO, "02_pdfs_originais")
DIR_PREVIEW    <- path(DIR_PROJETO, "03_preview_recortes")
DIR_RECORTES   <- path(DIR_PROJETO, "04_recortes")
DIR_PAGINAS    <- path(DIR_PROJETO, "05_paginas")
DIR_SAIDA      <- path(DIR_PROJETO, "06_pdf_final")
DIR_AUDITORIA  <- path(DIR_PROJETO, "07_auditoria")

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
DPI_FINAL   <- 220

# A4 em aproximadamente 200 dpi
PAG_W <- 1654
PAG_H <- 2339

MARGEM_X <- 80
MARGEM_Y <- 80
GUTTER   <- 46
ESPACO_BLOCO <- 26

# V1.8.3 — compactação controlada para evitar páginas subutilizadas.
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

# Gabarito do estudante:
# "FINAL" ou "APOS_CADA_QUESTAO"
GABARITO_ESTUDANTE <- "FINAL"

ARQUIVO_CACHE_RECORTES <- path(
  DIR_PROJETO,
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
        id_ocorrencia = character(),
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

salvar_cache <- function(cache) {
  write_excel_csv(
    cache |>
      distinct(
        id_ocorrencia,
        .keep_all = TRUE
      ),
    ARQUIVO_CACHE_RECORTES,
    na = ""
  )
}

capturar_recorte_interativo <- function(
  png_preview,
  id_ocorrencia
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
      id_ocorrencia,
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
      id_ocorrencia,
      call. = FALSE
    )
  }

  x1 <- min(pontos$x)
  x2 <- max(pontos$x)
  y1 <- min(pontos$y)
  y2 <- max(pontos$y)

  tibble(
    id_ocorrencia = id_ocorrencia,
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
      limpar_nome(item$id_ocorrencia),
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
        id_ocorrencia = item$id_ocorrencia,
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
        id_ocorrencia == item$id_ocorrencia
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
  }

  preview <- obter_preview(
    item,
    pdf_local
  )

  capturar_recorte_interativo(
    preview,
    item$id_ocorrencia
  )
}

recortar_questao <- function(
  pdf_local,
  pagina,
  recorte,
  id_ocorrencia
) {
  png_pagina <- path(
    DIR_RECORTES,
    paste0(
      limpar_nome(id_ocorrencia),
      "_pagina.png"
    )
  )

  renderizar_pagina_png(
    pdf_local,
    pagina,
    DPI_FINAL,
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
      limpar_nome(id_ocorrencia),
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
  titulo_h <- 48
  gab_h <- if (
    identical(
      GABARITO_ESTUDANTE,
      "APOS_CADA_QUESTAO"
    )
  ) 42 else 0

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
    gab_h +
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
      item$ordem_pdf
    ),
    size = 27,
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

  if (
    identical(
      GABARITO_ESTUDANTE,
      "APOS_CADA_QUESTAO"
    )
  ) {
    bloco <- image_annotate(
      bloco,
      paste0(
        "Gabarito: ",
        item$gabarito
      ),
      size = 23,
      gravity = "southwest",
      location = paste0(
        "+",
        margem,
        "+",
        margem
      )
    )
  }

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
      item$ordem_pdf,
      "  ·  ",
      item$id_ocorrencia
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
      "Dificuldade: ",
      texto_seguro(item$dificuldade_rotulo)
    ),
    paste0(
      "Função: ",
      texto_seguro(
        item$funcao_pedagogica_sugerida
      )
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

  fonte_meta <- if (largura <= COL_W) 17 else 20
  linha_h <- if (largura <= COL_W) 25 else 29

  meta_h <- max(
    1,
    length(linhas_wrap)
  ) * linha_h + 12

  gab_h <- 42

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
    gab_h +
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

  bloco <- image_annotate(
    bloco,
    paste0(
      "Gabarito: ",
      item$gabarito
    ),
    size = 22,
    gravity = "southwest",
    location = paste0(
      "+",
      margem,
      "+",
      margem
    )
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
        item$id_ocorrencia,
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
            item$id_ocorrencia,
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

criar_pagina_gabarito <- function(
  base,
  prefixo = "pagina_estudante"
) {
  canvas <- novo_canvas()

  canvas <- image_annotate(
    canvas,
    "Gabarito",
    size = 40,
    gravity = "northwest",
    location = paste0(
      "+",
      MARGEM_X,
      "+",
      MARGEM_Y
    )
  )

  linhas <- paste0(
    base$ordem_pdf,
    ". ",
    base$gabarito
  )

  n <- length(linhas)

  por_coluna <- ceiling(
    n / 2
  )

  esquerda <- linhas[
    seq_len(
      min(
        por_coluna,
        n
      )
    )
  ]

  direita <- if (
    n > por_coluna
  ) {
    linhas[
      (por_coluna + 1):n
    ]
  } else {
    character()
  }

  y0 <- MARGEM_Y + 90
  passo <- 42

  for (
    j in seq_along(esquerda)
  ) {
    canvas <- image_annotate(
      canvas,
      esquerda[j],
      size = 27,
      gravity = "northwest",
      location = paste0(
        "+",
        MARGEM_X + 15,
        "+",
        y0 + (j - 1) * passo
      )
    )
  }

  for (
    j in seq_along(direita)
  ) {
    canvas <- image_annotate(
      canvas,
      direita[j],
      size = 27,
      gravity = "northwest",
      location = paste0(
        "+",
        MARGEM_X + COL_W + GUTTER + 15,
        "+",
        y0 + (j - 1) * passo
      )
    )
  }

  arquivo <- path(
    DIR_PAGINAS,
    paste0(
      prefixo,
      "_gabarito.png"
    )
  )

  image_write(
    canvas,
    arquivo
  )

  arquivo
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
      density = 200
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
# LER PACOTE
# ------------------------------------------------------------

cat("\n")
cat("============================================================\n")
cat("NAVE — EDITORAÇÃO V1.8.3\n")
cat("Duas colunas adaptativas + correção da repetição\n")
cat("============================================================\n\n")

cat(
  "Autenticando no Google Drive...\n"
)

drive_auth()

LINK_CSV <- readline(
  paste0(
    "Cole o link do pacote CSV no Google Drive ",
    "e pressione ENTER: "
  )
)

ID_CSV <- extrair_id_drive(
  LINK_CSV
)

ARQUIVO_CSV <- path(
  DIR_CSV,
  paste0(
    "pacote_editoracao_",
    format(
      Sys.time(),
      "%Y%m%d_%H%M%S"
    ),
    ".csv"
  )
)

drive_download(
  as_id(ID_CSV),
  path = ARQUIVO_CSV,
  overwrite = TRUE
)

cat(
  "CSV baixado para: ",
  ARQUIVO_CSV,
  "\n"
)

base <- read_csv(
  ARQUIVO_CSV,
  show_col_types = FALSE,
  locale = locale(
    encoding = "UTF-8"
  ),
  na = c(
    "",
    "NA",
    "N/A"
  )
)

validar_colunas(
  base,
  c(
    "id_pacote_pdf",
    "id_projeto_editorial",
    "id_sequencia",
    "ordem_pdf",
    "id_ocorrencia",
    "gabarito",
    "id_arquivo_drive",
    "pagina_pdf",
    "crop_x",
    "crop_y",
    "crop_w",
    "crop_h"
  )
)

base <- base |>
  mutate(
    ordem_pdf = as.integer(
      ordem_pdf
    ),
    pagina_pdf = as.integer(
      pagina_pdf
    ),
    gabarito = str_to_upper(
      str_trim(gabarito)
    ),
    id_arquivo_drive =
      as.character(
        id_arquivo_drive
      )
  ) |>
  arrange(
    ordem_pdf
  )

n_antes_dedup <- nrow(base)

base <- base |>
  distinct(
    id_projeto_editorial,
    ordem_pdf,
    id_ocorrencia,
    .keep_all = TRUE
  ) |>
  arrange(
    ordem_pdf
  )

if (nrow(base) < n_antes_dedup) {
  cat(
    "ATENÇÃO: ",
    n_antes_dedup - nrow(base),
    " linha(s) duplicada(s) foram removidas do pacote.\n"
  )
}

gabaritos_invalidos <- base |>
  filter(
    !gabarito %in%
      c(
        "A",
        "B",
        "C",
        "D",
        "E"
      )
  )

if (
  nrow(gabaritos_invalidos)
) {
  stop(
    "Há questões sem gabarito válido: ",
    paste(
      gabaritos_invalidos$id_ocorrencia,
      collapse = ", "
    ),
    call. = FALSE
  )
}

id_pacote <- unique(
  base$id_pacote_pdf
)

if (
  length(id_pacote) != 1
) {
  stop(
    "Use somente um pacote por execução.",
    call. = FALSE
  )
}

id_pacote <- id_pacote[[1]]

# ------------------------------------------------------------
# BAIXAR FONTES
# ------------------------------------------------------------

# V1.8.2 — IMPORTANTE:
# vários componentes podem apontar para o MESMO PDF de Ciências da Natureza.
# Se criarmos uma linha de "fontes" por componente e depois fizermos join
# apenas por id_arquivo_drive, cada questão é multiplicada (ex.: 3 vezes
# para Química/Física/Biologia). Por isso o mapa de fontes precisa ter
# EXATAMENTE uma linha por arquivo do Drive.

fontes <- base |>
  transmute(
    id_arquivo_drive = as.character(id_arquivo_drive),
    nome_fonte = paste(
      area,
      colecao_origem,
      sep = "_"
    )
  ) |>
  distinct(
    id_arquivo_drive,
    .keep_all = TRUE
  ) |>
  mutate(
    caminho_pdf = map2_chr(
      id_arquivo_drive,
      nome_fonte,
      baixar_pdf_drive
    )
  )

if (
  anyDuplicated(fontes$id_arquivo_drive)
) {
  stop(
    "Falha interna: o mapa de PDFs contém IDs duplicados.",
    call. = FALSE
  )
}

base_proc <- base |>
  left_join(
    fontes |>
      select(
        id_arquivo_drive,
        caminho_pdf
      ),
    by = "id_arquivo_drive"
  )

if (nrow(base_proc) != nrow(base)) {
  stop(
    "AUDITORIA: o vínculo com PDFs alterou a quantidade de questões. ",
    "Antes: ", nrow(base),
    " | Depois: ", nrow(base_proc),
    ".",
    call. = FALSE
  )
}

# ------------------------------------------------------------
# RECORTAR QUESTÕES
# ------------------------------------------------------------

cache <- carregar_cache()
auditoria <- vector(
  "list",
  nrow(base_proc)
)

arquivos_recortes <- character(
  nrow(base_proc)
)

crop_x_layout <- rep(NA_real_, nrow(base_proc))
crop_y_layout <- rep(NA_real_, nrow(base_proc))
crop_w_layout <- rep(NA_real_, nrow(base_proc))
crop_h_layout <- rep(NA_real_, nrow(base_proc))

for (
  i in seq_len(
    nrow(base_proc)
  )
) {
  item <- base_proc[i, ]

  cat(
    sprintf(
      "[%d/%d] %s — página %d\n",
      i,
      nrow(base_proc),
      item$id_ocorrencia,
      item$pagina_pdf
    )
  )

  recorte <- obter_recorte(
    item,
    item$caminho_pdf,
    cache
  )

  arquivo_recorte <- recortar_questao(
    item$caminho_pdf,
    item$pagina_pdf,
    recorte,
    item$id_ocorrencia
  )

  if (
    !recorte_tem_conteudo(
      arquivo_recorte
    )
  ) {
    cat(
      "  ATENÇÃO: recorte praticamente vazio. ",
      "Será solicitado novo recorte.\n"
    )

    cache <- cache |>
      filter(
        id_ocorrencia !=
          item$id_ocorrencia
      )

    recorte <- obter_recorte(
      item,
      item$caminho_pdf,
      cache,
      ignorar_cache = TRUE
    )

    arquivo_recorte <- recortar_questao(
      item$caminho_pdf,
      item$pagina_pdf,
      recorte,
      item$id_ocorrencia
    )

    if (
      !recorte_tem_conteudo(
        arquivo_recorte
      )
    ) {
      stop(
        "O novo recorte de ",
        item$id_ocorrencia,
        " ainda parece vazio. ",
        "Revise a página e tente novamente.",
        call. = FALSE
      )
    }
  }

  cache <- bind_rows(
    cache |>
      filter(
        id_ocorrencia !=
          item$id_ocorrencia
      ),
    recorte
  )

  salvar_cache(
    cache
  )

  arquivos_recortes[i] <-
    arquivo_recorte

  crop_x_layout[i] <- as.numeric(recorte$crop_x)
  crop_y_layout[i] <- as.numeric(recorte$crop_y)
  crop_w_layout[i] <- as.numeric(recorte$crop_w)
  crop_h_layout[i] <- as.numeric(recorte$crop_h)

  auditoria[[i]] <- tibble(
    ordem_pdf = item$ordem_pdf,
    id_ocorrencia = item$id_ocorrencia,
    pagina_pdf = item$pagina_pdf,
    crop_x = recorte$crop_x,
    crop_y = recorte$crop_y,
    crop_w = recorte$crop_w,
    crop_h = recorte$crop_h,
    gabarito = item$gabarito,
    arquivo_recorte =
      arquivo_recorte
  )
}

base_layout <- base_proc |>
  mutate(
    arquivo_recorte = arquivos_recortes,
    crop_x_layout = crop_x_layout,
    crop_y_layout = crop_y_layout,
    crop_w_layout = crop_w_layout,
    crop_h_layout = crop_h_layout
  )

# Auditoria final contra duplicação lógica.
duplicadas_layout <- base_layout |>
  count(
    ordem_pdf,
    id_ocorrencia,
    name = "n"
  ) |>
  filter(n > 1)

if (nrow(duplicadas_layout)) {
  stop(
    "AUDITORIA: ainda existem questões duplicadas no layout: ",
    paste(
      duplicadas_layout$id_ocorrencia,
      collapse = ", "
    ),
    call. = FALSE
  )
}

# ------------------------------------------------------------
# MONTAR CADERNO DO ESTUDANTE
# ------------------------------------------------------------

cat(
  "\nMontando Caderno do Estudante em duas colunas...\n"
)

paginas_estudante <- montar_paginas(
  base_layout,
  tipo = "estudante"
)

if (
  identical(
    GABARITO_ESTUDANTE,
    "FINAL"
  )
) {
  paginas_estudante <- c(
    paginas_estudante,
    criar_pagina_gabarito(
      base_layout
    )
  )
}

# ------------------------------------------------------------
# MONTAR CADERNO DO PROFESSOR
# ------------------------------------------------------------

cat(
  "Montando Caderno do Professor em duas colunas adaptativas...\n"
)

paginas_professor <- montar_paginas(
  base_layout,
  tipo = "professor"
)

# ------------------------------------------------------------
# GRAVAR PDFs
# ------------------------------------------------------------

arquivo_estudante <- path(
  DIR_SAIDA,
  paste0(
    "NAVE_",
    limpar_nome(id_pacote),
    "_CADERNO_ESTUDANTE_V183.pdf"
  )
)

arquivo_professor <- path(
  DIR_SAIDA,
  paste0(
    "NAVE_",
    limpar_nome(id_pacote),
    "_CADERNO_PROFESSOR_V183.pdf"
  )
)

gravar_pdf_paginas(
  paginas_estudante,
  arquivo_estudante
)

gravar_pdf_paginas(
  paginas_professor,
  arquivo_professor
)

# ------------------------------------------------------------
# AUDITORIA
# ------------------------------------------------------------

aud <- bind_rows(
  auditoria
)

arquivo_auditoria <- path(
  DIR_AUDITORIA,
  paste0(
    "auditoria_recortes_",
    limpar_nome(id_pacote),
    "_v183.csv"
  )
)

write_excel_csv(
  aud,
  arquivo_auditoria,
  na = ""
)

# ------------------------------------------------------------
# FINAL
# ------------------------------------------------------------

cat("\n")
cat("============================================================\n")
cat("EDITORAÇÃO V1.8.3 CONCLUÍDA\n")
cat("============================================================\n")
cat(
  "Questões:              ",
  nrow(base_layout),
  "\n"
)
cat(
  "Páginas estudante:     ",
  length(paginas_estudante),
  "\n"
)
cat(
  "Páginas professor:     ",
  length(paginas_professor),
  "\n"
)
cat(
  "Auditoria anti-repetição: estudante=",
  pdftools::pdf_info(arquivo_estudante)$pages,
  " / professor=",
  pdftools::pdf_info(arquivo_professor)$pages,
  "\n"
)
cat(
  "Caderno estudante:     ",
  arquivo_estudante,
  "\n"
)
cat(
  "Caderno professor:     ",
  arquivo_professor,
  "\n"
)
cat(
  "Auditoria:             ",
  arquivo_auditoria,
  "\n"
)
cat(
  "Cache de recortes:     ",
  ARQUIVO_CACHE_RECORTES,
  "\n"
)
cat("============================================================\n")

if (
  identical(
    Sys.info()[["sysname"]],
    "Windows"
  )
) {
  shell.exec(
    normalizePath(
      DIR_SAIDA
    )
  )
}
