# EDITORAÇÃO CENTRAL V1.9.1
# Saídas neutras, contrato V2 e packing pré-medido.

`%||%` <- function(x, y) if (is.null(x) || !length(x) || is.na(x[[1]])) y else x

opcao_auto_v190 <- Sys.getenv("NAVE_V190_NO_AUTO_RUN", unset = NA_character_)
opcao_teste_v190 <- Sys.getenv("NAVE_V190_SELF_TEST", unset = NA_character_)
Sys.setenv(NAVE_V190_NO_AUTO_RUN = "1")
Sys.unsetenv("NAVE_V190_SELF_TEST")
source(file.path(dirname(sys.frame(1)$ofile %||% "rstudio/01_gerar_cadernos_nave_v191.R"),
                 "01_gerar_cadernos_nave_v190.R"), local = FALSE)
if (is.na(opcao_auto_v190)) Sys.unsetenv("NAVE_V190_NO_AUTO_RUN") else Sys.setenv(NAVE_V190_NO_AUTO_RUN = opcao_auto_v190)
if (is.na(opcao_teste_v190)) Sys.unsetenv("NAVE_V190_SELF_TEST") else Sys.setenv(NAVE_V190_SELF_TEST = opcao_teste_v190)

SCHEMA_ESPERADO_V191 <- "NAVE_EDITORIAL_CENTRAL_V2"
DIR_PROJETO <- "C:/NAVE/PACOTES_EDITORIAIS_V191"
DIR_CSV <- path(DIR_PROJETO, "01_csv")
DIR_FONTES <- path(DIR_PROJETO, "02_fontes")
DIR_PREVIEW <- path(DIR_PROJETO, "03_recortes", "preview")
DIR_RECORTES <- path(DIR_PROJETO, "03_recortes", "imagens")
DIR_PAGINAS <- path(DIR_PROJETO, "03_recortes", "paginas")
DIR_SAIDA <- path(DIR_PROJETO, "04_pdf_final")
DIR_AUDITORIA <- path(DIR_PROJETO, "05_auditoria")
ARQUIVO_CACHE_RECORTES <- path(DIR_PROJETO, "recortes_cache_v191.csv")
dir_create(c(DIR_PROJETO, DIR_CSV, DIR_FONTES, DIR_PREVIEW, DIR_RECORTES,
             DIR_PAGINAS, DIR_SAIDA, DIR_AUDITORIA))

HEADER_FIRST_H <- round(0.82 * DPI_SAIDA)
HEADER_COMPACT_H <- round(0.38 * DPI_SAIDA)
FOOTER_H <- round(0.28 * DPI_SAIDA)
BEAM_WIDTH_V191 <- 28L
FATORES_COMPACTACAO_V191 <- c(1, 0.95, 0.90)
AUDITORIA_FONTES_V191 <- tibble()
CONTEXTO_RENDER_V191 <- list(id_questao = "")

validar_entrada_central_v191 <- function(base) {
  obrigatorias_v1 <- c(
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
  esperadas <- append(obrigatorias_v1, "professor", after = 6)
  validar_colunas(base, esperadas)
  if (!identical(names(base), esperadas) || length(esperadas) != 46) {
    stop("O CSV V2 deve conter exatamente 46 colunas na ordem contratada.", call. = FALSE)
  }
  if (any(str_trim(as.character(base$schema_version)) != SCHEMA_ESPERADO_V191)) {
    stop("V1.9.1 aceita exclusivamente NAVE_EDITORIAL_CENTRAL_V2.", call. = FALSE)
  }
  professor_por_linha <- str_trim(as.character(base$professor))
  if (any(is.na(professor_por_linha) | !nzchar(professor_por_linha))) {
    stop("O CSV V2 não pode possuir professor vazio em nenhuma linha.", call. = FALSE)
  }
  professores <- unique(professor_por_linha)
  if (length(professores) != 1) {
    stop("O CSV V2 deve possuir exatamente um professor não vazio.", call. = FALSE)
  }
  # Reutiliza as invariantes V1 sem alterar o V1: remove apenas a coluna aditiva.
  base_v1 <- base |> select(-professor)
  base_v1$schema_version <- "NAVE_EDITORIAL_CENTRAL_V1"
  validada_v1 <- validar_entrada_central_v190(base_v1)
  validada_v1 |>
    mutate(professor = professores[[1]], .after = descricao)
}

metadados_documento_v191 <- function(base) {
  unico <- function(campo) {
    valores <- unique(str_trim(as.character(base[[campo]])))
    valores <- valores[!is.na(valores)]
    if (length(valores) != 1) stop("Campo inconsistente: ", campo, call. = FALSE)
    valores[[1]]
  }
  list(titulo = unico("titulo"), descricao = unico("descricao"), professor = unico("professor"))
}

texto_cabecalho_v191 <- function(meta, primeira = FALSE) {
  if (primeira) {
    paste(c(meta$titulo, meta$descricao, paste0("Professor: ", meta$professor)), collapse = "\n")
  } else {
    paste(meta$titulo, meta$descricao, paste0("Professor: ", meta$professor), sep = " · ")
  }
}

adicionar_moldura_pagina_v191 <- function(canvas, meta, pagina, total) {
  primeira <- pagina == 1
  canvas <- image_annotate(
    canvas, texto_cabecalho_v191(meta, primeira),
    size = if (primeira) round(25 * DPI_SAIDA / 200) else round(16 * DPI_SAIDA / 200),
    gravity = "northwest", location = paste0("+", MARGEM_X, "+", round(0.18 * DPI_SAIDA))
  )
  image_annotate(
    canvas, paste0("Página ", pagina, " de ", total),
    size = round(14 * DPI_SAIDA / 200), gravity = "south",
    location = paste0("+0+", round(0.10 * DPI_SAIDA))
  )
}

criar_bloco_estudante_v191 <- function(item, recorte_png, largura) {
  margem <- 18L
  titulo_h <- 76L
  img <- image_read(recorte_png)
  info <- image_info(img)[1, ]
  alvo_w <- largura - 2 * margem
  nova_h <- round(info$height * alvo_w / info$width)
  img <- image_resize(img, paste0(alvo_w, "x", nova_h, "!"))
  bloco <- image_blank(largura, titulo_h + nova_h + 2 * margem, color = "white")
  bloco <- image_annotate(
    bloco,
    paste0("Questão ", item$ordem, "\n", formatar_habilidade_v190(item$habilidade),
           " · ", texto_seguro(item$dificuldade)),
    size = round(23 * DPI_SAIDA / 200), gravity = "northwest",
    location = paste0("+", margem, "+", margem)
  )
  image_composite(bloco, img, offset = paste0("+", margem, "+", margem + titulo_h))
}

criar_bloco_professor_v191 <- function(item, recorte_png, largura) {
  margem <- 18L
  largura_wrap <- if (largura <= COL_W) 54 else 105
  linhas <- c(
    paste0("Questão ", item$ordem),
    paste(texto_seguro(item$area), texto_seguro(item$componente), sep = " · "),
    paste(texto_seguro(item$competencia), formatar_habilidade_v190(item$habilidade), sep = " · "),
    paste0("Objeto: ", texto_seguro(item$objeto_principal)),
    paste0("Ação cognitiva: ", texto_seguro(item$acao_cognitiva)),
    paste(texto_seguro(item$dificuldade), texto_seguro(item$funcao_pedagogica),
          paste0(texto_seguro(item$tempo_estimado_min), " min"), sep = " · "),
    paste(paste0("Gabarito oficial: ", texto_seguro(item$gabarito_oficial)),
          texto_seguro(item$ano), texto_seguro(item$edicao), sep = " · ")
  )
  principal <- unlist(lapply(linhas, quebrar_texto, largura = largura_wrap), use.names = FALSE)
  tecnico <- paste0(
    "Fonte: ", texto_seguro(item$nome_publico_fonte), " · p. ", texto_seguro(item$pagina_pdf),
    " · ", texto_seguro(item$status_validacao), " · ", texto_seguro(item$maturidade_curadoria)
  )
  linha_h <- if (largura <= COL_W) 29L else 32L
  meta_h <- (length(principal) + 1) * linha_h + 22L
  img <- image_read(recorte_png)
  info <- image_info(img)[1, ]
  alvo_w <- largura - 2 * margem
  nova_h <- round(info$height * alvo_w / info$width)
  img <- image_resize(img, paste0(alvo_w, "x", nova_h, "!"))
  bloco <- image_blank(largura, meta_h + nova_h + 2 * margem, color = "white")
  y <- margem
  for (linha in principal) {
    bloco <- image_annotate(bloco, linha, size = round(17 * DPI_SAIDA / 200),
                            gravity = "northwest", location = paste0("+", margem, "+", y))
    y <- y + linha_h
  }
  bloco <- image_annotate(bloco, tecnico, size = round(13 * DPI_SAIDA / 200),
                          color = "#666666", gravity = "northwest",
                          location = paste0("+", margem, "+", y))
  y <- y + linha_h + 6L
  image_composite(bloco, img, offset = paste0("+", margem, "+", y))
}

criar_candidatos_v191 <- function(itens, tipo) {
  map(seq_len(nrow(itens)), function(i) {
    item <- itens[i, ]
    criador <- if (tipo == "estudante") criar_bloco_estudante_v191 else criar_bloco_professor_v191
    col <- criador(item, item$arquivo_recorte, COL_W)
    full <- criador(item, item$arquivo_recorte, FULL_W)
    list(
      ordem = item$ordem,
      col = col,
      full = full,
      h_col = image_info(col)$height,
      h_full = image_info(full)$height,
      largo = usar_largura_total(item, item$arquivo_recorte)
    )
  })
}

score_estado_v191 <- function(estado) {
  paginas <- estado$pagina
  limite <- PAG_H - MARGEM_Y - FOOTER_H
  vazio <- max(0, limite - estado$yl) + max(0, limite - estado$yr)
  paginas * 1e9 + vazio * 100 + abs(estado$yl - estado$yr) + estado$penalidade
}

adicionar_estado_v191 <- function(estado, cand, modo, lado, fator, nova = FALSE) {
  pagina <- estado$pagina + if (nova) 1L else 0L
  inicio <- MARGEM_Y + if (pagina == 1L) HEADER_FIRST_H else HEADER_COMPACT_H
  yl <- if (nova) inicio else estado$yl
  yr <- if (nova) inicio else estado$yr
  limite <- PAG_H - MARGEM_Y - FOOTER_H
  h0 <- if (modo == "full") cand$h_full else cand$h_col
  h <- round(h0 * fator)
  if (modo == "full") {
    y <- max(yl, yr)
    if (y + h > limite) return(NULL)
    x <- MARGEM_X + floor((FULL_W - round(FULL_W * fator)) / 2)
    yl <- yr <- y + h + ESPACO_BLOCO
  } else {
    y <- if (lado == "esq") yl else yr
    if (y + h > limite) return(NULL)
    x0 <- if (lado == "esq") MARGEM_X else MARGEM_X + COL_W + GUTTER
    x <- x0 + floor((COL_W - round(COL_W * fator)) / 2)
    if (lado == "esq") yl <- y + h + ESPACO_BLOCO else yr <- y + h + ESPACO_BLOCO
  }
  placement <- list(ordem = cand$ordem, pagina = pagina, modo = modo,
                    lado = lado, fator = fator, x = x, y = y)
  list(pagina = pagina, yl = yl, yr = yr,
       placements = c(estado$placements, list(placement)),
       penalidade = estado$penalidade + (1 - fator) * 1e6 +
         if (cand$largo && modo == "col") 2e6 else 0)
}

planejar_packing_v191 <- function(candidatos, beam_width = BEAM_WIDTH_V191) {
  inicio <- MARGEM_Y + HEADER_FIRST_H
  estados <- list(list(pagina = 1L, yl = inicio, yr = inicio,
                       placements = list(), penalidade = 0))
  for (cand in candidatos) {
    proximos <- list()
    for (estado in estados) {
      for (fator in FATORES_COMPACTACAO_V191) {
        for (lado in c("esq", "dir")) {
          x <- adicionar_estado_v191(estado, cand, "col", lado, fator)
          if (!is.null(x) && ordem_visual_valida_v191(x$placements)) proximos[[length(proximos) + 1]] <- x
        }
        x <- adicionar_estado_v191(estado, cand, "full", "full", fator)
        if (!is.null(x) && ordem_visual_valida_v191(x$placements)) proximos[[length(proximos) + 1]] <- x
      }
      for (modo in c("col", "full")) {
        lados <- if (modo == "col") c("esq", "dir") else "full"
        for (lado in lados) for (fator in FATORES_COMPACTACAO_V191) {
          x <- adicionar_estado_v191(estado, cand, modo, lado, fator, nova = TRUE)
          if (!is.null(x) && ordem_visual_valida_v191(x$placements)) proximos[[length(proximos) + 1]] <- x
        }
      }
    }
    if (!length(proximos)) {
      stop("Nenhuma configuração de packing é possível.", call. = FALSE)
    }
    ord <- order(vapply(proximos, score_estado_v191, numeric(1)))
    estados <- proximos[head(ord, beam_width)]
  }
  estados[[which.min(vapply(estados, score_estado_v191, numeric(1)))]]
}

ordem_visual_valida_v191 <- function(placements) {
  if (length(placements) < 2) return(TRUE)
  tabela <- map_dfr(seq_along(placements), function(i) {
    pl <- placements[[i]]
    tibble(insercao = i, ordem = pl$ordem, pagina = pl$pagina, y = pl$y, x = pl$x)
  })
  visual <- tabela |> arrange(pagina, y, x) |> pull(ordem)
  identical(as.integer(visual), as.integer(tabela$ordem))
}

montar_paginas_v191 <- function(itens, tipo, meta, candidatos = NULL, plano = NULL) {
  if (is.null(candidatos)) candidatos <- criar_candidatos_v191(itens, tipo)
  if (is.null(plano)) plano <- planejar_packing_v191(candidatos)
  total <- plano$pagina
  canvases <- map(seq_len(total), ~ adicionar_moldura_pagina_v191(novo_canvas(), meta, .x, total))
  for (pl in plano$placements) {
    cand <- candidatos[[pl$ordem]]
    bloco <- if (pl$modo == "full") cand$full else cand$col
    if (pl$fator < 1) bloco <- image_resize(bloco, paste0(round(image_info(bloco)$width * pl$fator), "x"))
    canvases[[pl$pagina]] <- image_composite(
      canvases[[pl$pagina]], bloco,
      offset = paste0("+", pl$x, "+", pl$y), operator = "over"
    )
  }
  arquivos <- map2_chr(canvases, seq_along(canvases), ~ salvar_canvas(.x, paste0("pagina_", tipo, "_v191"), .y))
  list(arquivos = arquivos, plano = plano, candidatos = candidatos)
}

criar_paginas_gabaritos_v191 <- function(base, meta) {
  linhas <- c("Questão        Gabarito", sprintf("%4d              %s", base$ordem, base$gabarito_oficial))
  canvas <- adicionar_moldura_pagina_v191(novo_canvas(), meta, 1, 1)
  canvas <- image_annotate(canvas, paste(linhas, collapse = "\n\n"),
                           size = round(25 * DPI_SAIDA / 200), gravity = "north",
                           location = paste0("+0+", MARGEM_Y + HEADER_FIRST_H + 60))
  salvar_canvas(canvas, "pagina_gabaritos_v191", 1)
}

carregar_matriz_pedagogica_v191 <- function(caminho) {
  if (is.null(caminho) || !file_exists(caminho)) {
    stop("MATRIZ_ENEM_PEDAGOGICA aprovada é obrigatória para o anexo V2.", call. = FALSE)
  }
  matriz <- read_csv(caminho, show_col_types = FALSE, locale = locale(encoding = "UTF-8"))
  campos <- c("area", "componente", "competencia", "descricao_competencia",
              "habilidade", "descricao_habilidade", "interpretacao_pedagogica",
              "operacao_cognitiva", "expectativa_aprendizagem",
              "dificuldades_frequentes", "orientacoes_intervencao", "versao",
              "revisado_por", "revisado_em", "status_revisao")
  validar_colunas(matriz, campos)
  matriz <- matriz |> filter(str_to_lower(iconv(status_revisao, to = "ASCII//TRANSLIT")) == "aprovado")
  chave <- paste(matriz$area, matriz$competencia, matriz$habilidade, sep = "|")
  if (anyDuplicated(chave)) stop("Chave duplicada em MATRIZ_ENEM_PEDAGOGICA.", call. = FALSE)
  matriz
}

criar_paginas_anexo_v191 <- function(base, matriz, meta) {
  chaves_base <- base |> distinct(area, competencia, habilidade)
  conteudo <- chaves_base |> left_join(matriz, by = c("area", "competencia", "habilidade"))
  obrig <- c("descricao_competencia", "descricao_habilidade", "interpretacao_pedagogica",
             "operacao_cognitiva", "expectativa_aprendizagem",
             "dificuldades_frequentes", "orientacoes_intervencao")
  faltantes <- conteudo |> filter(if_any(all_of(obrig), ~ is.na(.x) | !nzchar(str_trim(as.character(.x)))))
  if (nrow(faltantes)) {
    stop("Anexo V2 sem conteúdo institucional aprovado para: ",
         paste(paste(faltantes$area, faltantes$competencia, faltantes$habilidade, sep = "/"), collapse = ", "),
         call. = FALSE)
  }
  linhas <- character()
  for (i in seq_len(nrow(conteudo))) {
    x <- conteudo[i, ]
    questoes <- base |> filter(area == x$area, competencia == x$competencia, habilidade == x$habilidade)
    linhas <- c(linhas,
      paste0("COMPETÊNCIA ", x$competencia), x$descricao_competencia,
      paste0("HABILIDADE ", x$habilidade), x$descricao_habilidade,
      "INTERPRETAÇÃO PEDAGÓGICA", x$interpretacao_pedagogica,
      "OPERAÇÃO COGNITIVA", x$operacao_cognitiva,
      "EXPECTATIVA DE APRENDIZAGEM", x$expectativa_aprendizagem,
      "APLICAÇÃO AO CADERNO",
      paste0("Questões: ", paste(questoes$ordem, collapse = ", "),
             " · Objetos: ", paste(unique(questoes$objeto_principal), collapse = "; ")),
      "PONTOS DE ATENÇÃO", x$dificuldades_frequentes,
      "ORIENTAÇÕES DE INTERVENÇÃO", x$orientacoes_intervencao, "")
  }
  linhas <- c(linhas, "ÍNDICE PEDAGÓGICO FINAL",
    apply(base |> select(ordem, componente, competencia, habilidade, objeto_principal,
                         dificuldade, funcao_pedagogica, gabarito_oficial), 1, paste, collapse = " · "))
  criar_paginas_texto_v191(linhas, "pagina_anexo_v191", "ANEXO PEDAGÓGICO", meta)
}

politica_anexo_v191 <- function(modo_previa, matriz_aprovada_disponivel) {
  if (!isTRUE(matriz_aprovada_disponivel) && !isTRUE(modo_previa)) {
    stop("MATRIZ_ENEM_PEDAGOGICA aprovada é obrigatória para o anexo V2.", call. = FALSE)
  }
  isTRUE(matriz_aprovada_disponivel)
}

resolver_anexo_v191 <- function(base, caminho_matriz, meta, modo_previa = FALSE,
                                matriz_precarregada = NULL) {
  caminho_disponivel <- !is.null(matriz_precarregada) ||
    (!is.null(caminho_matriz) && length(caminho_matriz) == 1L &&
      !is.na(caminho_matriz) && nzchar(caminho_matriz) && file_exists(caminho_matriz))

  if (!politica_anexo_v191(modo_previa, caminho_disponivel)) {
    return(list(
      arquivos = character(),
      gerado = FALSE,
      motivo = "Matriz pedagógica aprovada indisponível"
    ))
  }

  matriz <- if (is.null(matriz_precarregada)) {
    carregar_matriz_pedagogica_v191(caminho_matriz)
  } else {
    matriz_precarregada
  }
  if (!nrow(matriz)) {
    if (!isTRUE(modo_previa)) {
      stop("MATRIZ_ENEM_PEDAGOGICA aprovada não possui conteúdo aplicável.", call. = FALSE)
    }
    return(list(
      arquivos = character(),
      gerado = FALSE,
      motivo = "Matriz pedagógica aprovada indisponível"
    ))
  }

  arquivos <- tryCatch(
    criar_paginas_anexo_v191(base, matriz, meta),
    error = function(erro) {
      if (isTRUE(modo_previa) && grepl(
        "sem conteúdo institucional aprovado",
        conditionMessage(erro),
        ignore.case = TRUE
      )) {
        return(character())
      }
      stop(erro)
    }
  )

  if (!length(arquivos)) {
    return(list(
      arquivos = character(),
      gerado = FALSE,
      motivo = "Matriz pedagógica aprovada indisponível"
    ))
  }

  list(arquivos = arquivos, gerado = TRUE, motivo = "")
}

criar_paginas_texto_v191 <- function(linhas, prefixo, titulo, meta) {
  expandidas <- unlist(map(linhas, ~ quebrar_texto(as.character(.x), 105)), use.names = FALSE)
  grupos <- split(expandidas, ceiling(seq_along(expandidas) / 38))
  total <- length(grupos)
  map2_chr(grupos, seq_along(grupos), function(grupo, pagina) {
    canvas <- adicionar_moldura_pagina_v191(novo_canvas(), meta, pagina, total)
    canvas <- image_annotate(canvas, titulo, size = round(24 * DPI_SAIDA / 200),
                             weight = 700, gravity = "northwest",
                             location = paste0("+", MARGEM_X, "+", MARGEM_Y +
                               if (pagina == 1L) HEADER_FIRST_H else HEADER_COMPACT_H))
    canvas <- image_annotate(canvas, paste(grupo, collapse = "\n"),
                             size = round(16 * DPI_SAIDA / 200), gravity = "northwest",
                             location = paste0("+", MARGEM_X, "+", MARGEM_Y +
                               if (pagina == 1L) HEADER_FIRST_H + 65 else HEADER_COMPACT_H + 65))
    salvar_canvas(canvas, prefixo, pagina)
  })
}

auditar_plano_v191 <- function(layout, plano, tipo) {
  map_dfr(plano$placements, function(pl) {
    arquivo <- layout$arquivo_recorte[layout$ordem == pl$ordem][[1]]
    largura <- (if (pl$modo == "full") FULL_W else COL_W) * pl$fator - 36
    bind_cols(tibble(ordem = pl$ordem, tipo = tipo, modo = pl$modo, fator = pl$fator),
              avaliar_qualidade_arquivo_v190(arquivo, largura))
  })
}

validar_dpi_plano_v191 <- function(auditoria) {
  abaixo <- auditoria$dpi_efetivo_min < DPI_MINIMO_IMPRESSAO
  if (any(abaixo, na.rm = TRUE)) {
    stop("Packing final abaixo de 300 dpi.", call. = FALSE)
  }
  invisible(TRUE)
}

renderizar_pagina_png <- function(pdf, pagina, dpi, destino) {
  template <- paste0(path_ext_remove(destino), "_render_%d.%s")
  avisos <- character()
  renderizados <- withCallingHandlers(
    pdf_convert(pdf = pdf, format = "png", pages = as.integer(pagina),
                filenames = template, dpi = dpi, verbose = FALSE),
    warning = function(w) {
      msg <- conditionMessage(w)
      if (str_detect(msg, regex("Symbol|ArialUnicode", ignore_case = TRUE))) {
        avisos <<- c(avisos, msg)
        invokeRestart("muffleWarning")
      }
    }
  )
  if (length(renderizados) != 1 || !file_exists(renderizados[[1]])) {
    stop("Renderização não produziu exatamente uma página.", call. = FALSE)
  }
  if (file_exists(destino)) file_delete(destino)
  file_move(renderizados[[1]], destino)
  if (length(avisos)) {
    AUDITORIA_FONTES_V191 <<- bind_rows(AUDITORIA_FONTES_V191, tibble(
      arquivo = pdf, pagina = as.integer(pagina),
      id_questao = CONTEXTO_RENDER_V191$id_questao,
      warning = unique(avisos)
    ))
  }
  destino
}

nome_base_neutro_v191 <- function(titulo) {
  nome <- limpar_nome(iconv(titulo, to = "ASCII//TRANSLIT"))
  if (!nzchar(nome)) stop("Título inválido para nome de arquivo.", call. = FALSE)
  nome
}

nomes_saidas_v191 <- function(titulo, modo_previa = FALSE) {
  nome <- nome_base_neutro_v191(titulo)
  sufixo <- if (isTRUE(modo_previa)) "_PREVIA_V191.pdf" else "_V191.pdf"
  list(
    estudante = path(DIR_SAIDA, paste0(nome, "_CADERNO_ESTUDANTE", sufixo)),
    professor = path(DIR_SAIDA, paste0(nome, "_CADERNO_PROFESSOR", sufixo)),
    gabaritos = path(DIR_SAIDA, paste0(nome, "_CADERNO_GABARITOS", sufixo))
  )
}

executar_nave_v191 <- function(link_csv = NULL, caminho_matriz = NULL, modo_previa = FALSE) {
  if (!is.logical(modo_previa) || length(modo_previa) != 1L || is.na(modo_previa)) {
    stop("modo_previa deve ser TRUE ou FALSE.", call. = FALSE)
  }
  drive_auth()
  if (is.null(link_csv)) link_csv <- readline("Cole o link do CSV editorial central V2: ")
  id_csv <- extrair_id_drive(link_csv)
  arquivo_csv <- path(DIR_CSV, paste0("pacote_central_v2_", format(Sys.time(), "%Y%m%d_%H%M%S"), ".csv"))
  drive_download(as_id(id_csv), path = arquivo_csv, overwrite = TRUE)
  base <- read_csv(arquivo_csv, show_col_types = FALSE, locale = locale(encoding = "UTF-8"), na = c("", "NA", "N/A"))
  base <- validar_entrada_central_v191(base)
  meta <- metadados_documento_v191(base)
  matriz_final <- if (isTRUE(modo_previa)) {
    NULL
  } else {
    carregar_matriz_pedagogica_v191(caminho_matriz)
  }

  fontes <- base |> transmute(
    id_arquivo_drive = as.character(id_arquivo_drive),
    nome_fonte = if_else(nzchar(nome_publico_fonte), nome_publico_fonte, paste(area, colecao_origem, sep = "_"))
  ) |> distinct(id_arquivo_drive, .keep_all = TRUE) |>
    mutate(caminho_pdf = map2_chr(id_arquivo_drive, nome_fonte, baixar_pdf_drive))
  base_proc <- base |> left_join(fontes |> select(id_arquivo_drive, caminho_pdf), by = "id_arquivo_drive")
  if (nrow(base_proc) != nrow(base) || any(is.na(base_proc$caminho_pdf))) stop("Vínculo incompleto com PDFs.", call. = FALSE)

  cache <- carregar_cache(); cache_legado <- carregar_cache_legado()
  arquivos <- character(nrow(base_proc)); auditoria <- vector("list", nrow(base_proc))
  recortes_usados <- vector("list", nrow(base_proc))
  crops <- matrix(NA_real_, nrow(base_proc), 4)
  AUDITORIA_FONTES_V191 <<- tibble()
  for (i in seq_len(nrow(base_proc))) {
    item <- base_proc[i, ]
    recorte <- obter_recorte(item, item$caminho_pdf, cache, cache_legado)
    CONTEXTO_RENDER_V191$id_questao <<- item$id_questao
    arquivo <- recortar_questao(item$caminho_pdf, item$pagina_pdf, recorte, item$id_questao, DPI_RENDER_INICIAL)
    if (!recorte_tem_conteudo(arquivo)) stop("Recorte sem conteúdo: ", item$id_questao, call. = FALSE)
    largura <- if (usar_largura_total(item, arquivo)) FULL_W else COL_W
    qualidade <- avaliar_qualidade_arquivo_v190(arquivo, largura)
    if (qualidade$dpi_efetivo_min < DPI_MINIMO_IMPRESSAO) {
      arquivo <- recortar_questao(item$caminho_pdf, item$pagina_pdf, recorte, item$id_questao, DPI_RENDER_RETRY)
      qualidade <- avaliar_qualidade_arquivo_v190(arquivo, largura, rerenderizada = TRUE)
    }
    if (qualidade$dpi_efetivo_min < DPI_MINIMO_IMPRESSAO) stop("DPI abaixo de 300: ", item$id_questao, call. = FALSE)
    arquivos[i] <- arquivo; recortes_usados[[i]] <- recorte
    crops[i, ] <- c(recorte$crop_x, recorte$crop_y, recorte$crop_w, recorte$crop_h)
    auditoria[[i]] <- bind_cols(tibble(ordem = item$ordem, id_questao = item$id_questao,
                                      arquivo_recorte = arquivo), qualidade)
    cache <- bind_rows(cache |> filter(!(id_questao == item$id_questao & id_arquivo_drive == item$id_arquivo_drive & pagina_pdf == as.integer(item$pagina_pdf))), recorte)
    salvar_cache(cache)
  }
  layout <- base_proc |> mutate(arquivo_recorte = arquivos, crop_x_layout = crops[,1], crop_y_layout = crops[,2], crop_w_layout = crops[,3], crop_h_layout = crops[,4]) |> arrange(ordem)
  candidatos_estudante <- criar_candidatos_v191(layout, "estudante")
  candidatos_professor <- criar_candidatos_v191(layout, "professor")
  plano_estudante <- planejar_packing_v191(candidatos_estudante)
  plano_professor <- planejar_packing_v191(candidatos_professor)
  aud_final <- bind_rows(
    auditar_plano_v191(layout, plano_estudante, "estudante"),
    auditar_plano_v191(layout, plano_professor, "professor")
  )
  ordens_retry <- unique(aud_final$ordem[aud_final$dpi_efetivo_min < DPI_MINIMO_IMPRESSAO])
  if (length(ordens_retry)) {
    for (ordem_retry in ordens_retry) {
      i <- which(layout$ordem == ordem_retry)
      item <- layout[i, ]
      CONTEXTO_RENDER_V191$id_questao <<- item$id_questao
      layout$arquivo_recorte[i] <- recortar_questao(
        item$caminho_pdf, item$pagina_pdf, recortes_usados[[i]],
        item$id_questao, DPI_RENDER_RETRY
      )
    }
    candidatos_estudante <- criar_candidatos_v191(layout, "estudante")
    candidatos_professor <- criar_candidatos_v191(layout, "professor")
    plano_estudante <- planejar_packing_v191(candidatos_estudante)
    plano_professor <- planejar_packing_v191(candidatos_professor)
    aud_final <- bind_rows(
      auditar_plano_v191(layout, plano_estudante, "estudante"),
      auditar_plano_v191(layout, plano_professor, "professor")
    ) |> mutate(status_qualidade_imagem = if_else(
      ordem %in% ordens_retry & dpi_efetivo_min >= DPI_MINIMO_IMPRESSAO,
      "RENDERIZADA_NOVAMENTE", status_qualidade_imagem
    ))
  }
  validar_dpi_plano_v191(aud_final)
  estudante <- montar_paginas_v191(layout, "estudante", meta, candidatos_estudante, plano_estudante)
  professor <- montar_paginas_v191(layout, "professor", meta, candidatos_professor, plano_professor)
  anexo <- resolver_anexo_v191(
    layout, caminho_matriz, meta, modo_previa,
    matriz_precarregada = matriz_final
  )
  if (isTRUE(modo_previa) && !anexo$gerado) {
    message("Anexo pedagógico não gerado em modo de prévia.")
  }
  gabaritos <- criar_paginas_gabaritos_v191(layout, meta)

  write_excel_csv(bind_rows(auditoria), path(DIR_AUDITORIA, "auditoria_recortes_v191.csv"), na = "")
  write_excel_csv(aud_final, path(DIR_AUDITORIA, "auditoria_packing_v191.csv"), na = "")
  write_excel_csv(AUDITORIA_FONTES_V191, path(DIR_AUDITORIA, "auditoria_warnings_fontes_v191.csv"), na = "")

  saidas <- nomes_saidas_v191(meta$titulo, modo_previa)
  gravar_pdf_paginas(estudante$arquivos, saidas$estudante)
  gravar_pdf_paginas(c(professor$arquivos, anexo$arquivos), saidas$professor)
  gravar_pdf_paginas(gabaritos, saidas$gabaritos)
  c(saidas, list(
    modo_previa = isTRUE(modo_previa),
    anexo_pedagogico_gerado = isTRUE(anexo$gerado),
    motivo_anexo = anexo$motivo
  ))
}

fixture_editorial_central_v191 <- function(n = 4) {
  x <- fixture_editorial_central_v190(n)
  x$schema_version <- SCHEMA_ESPERADO_V191
  x |> mutate(professor = "Professor Teste", .after = descricao)
}

executar_testes_estruturais_v191 <- function() {
  deve_falhar <- function(expr, padrao) {
    erro <- tryCatch({ force(expr); NULL }, error = identity)
    stopifnot(inherits(erro, "error"), grepl(padrao, conditionMessage(erro), ignore.case = TRUE))
  }

  # A: o contrato e as invariantes V1 continuam exercitados sem alteração.
  suppressMessages(executar_testes_estruturais_v190())
  base <- fixture_editorial_central_v191()
  base$exportado_por <- "exportador@example.org"
  stopifnot(ncol(base) == 46, identical(validar_entrada_central_v191(base)$professor[[1]], "Professor Teste"))
  # B-D: professor é obrigatório e não deriva da autoria da exportação.
  sem_prof <- base; sem_prof$professor <- ""
  deve_falhar(validar_entrada_central_v191(sem_prof), "professor")
  parcial <- base; parcial$professor[2] <- ""
  deve_falhar(validar_entrada_central_v191(parcial), "professor")
  stopifnot(validar_entrada_central_v191(base)$professor[[1]] != base$exportado_por[[1]])

  # E-G e U: textos, moldura e nomes públicos permanecem neutros.
  cab <- texto_cabecalho_v191(list(titulo = "Aula 01", descricao = "3 Ano", professor = "Pessoa"), TRUE)
  proibidos <- regex("sequ.ncia|NAVE|escola|@", ignore_case = TRUE)
  stopifnot(!str_detect(cab, proibidos), str_detect(cab, "Professor: Pessoa"))
  moldura <- paste(deparse(body(adicionar_moldura_pagina_v191)), collapse = " ")
  stopifnot(!str_detect(moldura, regex("NAVE|escola|@|sequ.ncia", ignore_case = TRUE)))
  stopifnot(!str_detect(nome_base_neutro_v191("Aula 01"), regex("NAVE", ignore_case = TRUE)))

  # H-K: contratos de conteúdo dos três cadernos.
  stopifnot(!str_detect(paste(deparse(body(criar_bloco_estudante_v191)), collapse = " "), "gabarito_oficial|id_questao"))
  stopifnot(!str_detect(paste(deparse(body(criar_paginas_gabaritos_v191)), collapse = " "), "id_questao"))
  professor <- paste(deparse(body(criar_bloco_professor_v191)), collapse = " ")
  metadados_professor <- c("area", "componente", "competencia", "habilidade",
    "objeto_principal", "acao_cognitiva", "dificuldade", "funcao_pedagogica",
    "tempo_estimado_min", "gabarito_oficial", "ano", "edicao")
  stopifnot(all(str_detect(professor, fixed(metadados_professor))))

  # L: o anexo depende exclusivamente da matriz aprovada e falha sem cobertura.
  anexo <- paste(deparse(body(criar_paginas_anexo_v191)), collapse = " ")
  stopifnot(str_detect(anexo, "left_join"), str_detect(anexo, "sem conteúdo institucional aprovado"))

  # Prévia técnica: somente o anexo depende da matriz; o FINAL não é relaxado.
  deve_falhar(
    politica_anexo_v191(FALSE, FALSE),
    "MATRIZ_ENEM_PEDAGOGICA aprovada é obrigatória"
  )
  previa_sem_matriz <- resolver_anexo_v191(base, NULL, list(), TRUE)
  stopifnot(
    !previa_sem_matriz$gerado,
    !length(previa_sem_matriz$arquivos),
    previa_sem_matriz$motivo == "Matriz pedagógica aprovada indisponível",
    politica_anexo_v191(FALSE, TRUE),
    politica_anexo_v191(TRUE, TRUE)
  )
  corpos_independentes <- c(
    paste(deparse(body(criar_bloco_estudante_v191)), collapse = " "),
    paste(deparse(body(criar_bloco_professor_v191)), collapse = " "),
    paste(deparse(body(criar_paginas_gabaritos_v191)), collapse = " ")
  )
  stopifnot(
    !any(str_detect(corpos_independentes, "matriz|modo_previa")),
    str_detect(paste(deparse(body(resolver_anexo_v191)), collapse = " "),
               "criar_paginas_anexo_v191"),
    !str_detect(paste(previa_sem_matriz$arquivos, collapse = " "), ".+")
  )
  nomes_previa <- nomes_saidas_v191("Aula 01 Química 3", TRUE)
  nomes_final <- nomes_saidas_v191("Aula 01 Química 3", FALSE)
  stopifnot(
    all(str_detect(unlist(nomes_previa), "_PREVIA_V191\\.pdf$")),
    all(str_detect(unlist(nomes_final), "_V191\\.pdf$")),
    !any(str_detect(unlist(c(nomes_previa, nomes_final)),
                    regex("NAVE|escola", ignore_case = TRUE)))
  )

  # M-R: fixture de packing pré-medido, ordem, indivisibilidade, DPI e modos.
  sint <- list(
    list(ordem = 1, h_col = 1200, h_full = 900, largo = FALSE),
    list(ordem = 2, h_col = 1000, h_full = 850, largo = FALSE),
    list(ordem = 3, h_col = 900, h_full = 800, largo = FALSE),
    list(ordem = 4, h_col = 1400, h_full = 1000, largo = TRUE)
  )
  plano <- planejar_packing_v191(sint)
  stopifnot(plano$pagina == 1L)
  stopifnot(identical(
    vapply(plano$placements, `[[`, numeric(1), "ordem"),
    as.numeric(1:4)
  ))
  stopifnot(length(plano$placements) == 4L, !anyDuplicated(vapply(plano$placements, `[[`, numeric(1), "ordem")))
  stopifnot(ordem_visual_valida_v191(plano$placements))
  stopifnot(any(vapply(plano$placements, `[[`, character(1), "modo") == "full"))
  stopifnot(any(vapply(plano$placements, `[[`, character(1), "modo") == "col"))
  stopifnot(all(vapply(plano$placements, `[[`, numeric(1), "fator") >= 0.90))
  q300 <- avaliar_qualidade_dimensoes_v190(3000, 1500, 3600)
  stopifnot(q300$dpi_efetivo_min >= 300)
  deve_falhar(
    validar_dpi_plano_v191(tibble(dpi_efetivo_min = 299.99)),
    "abaixo de 300 dpi"
  )

  somente_coluna <- planejar_packing_v191(list(
    list(ordem = 1, h_col = 700, h_full = 4000, largo = FALSE)
  ))
  stopifnot(somente_coluna$placements[[1]]$modo == "col")
  somente_full <- planejar_packing_v191(list(
    list(ordem = 1, h_col = 3900, h_full = 900, largo = TRUE)
  ))
  stopifnot(somente_full$placements[[1]]$modo == "full")

  # S-T: template válido do Poppler e auditoria contextual de fontes.
  stopifnot(str_detect(paste(deparse(body(renderizar_pagina_png)), collapse = " "), "%d.%s"))
  render <- paste(deparse(body(renderizar_pagina_png)), collapse = " ")
  stopifnot(all(str_detect(render, fixed(c("arquivo", "pagina", "id_questao", "Symbol|ArialUnicode")))))
  message("Testes estruturais V1.9.1: OK")
  invisible(TRUE)
}

if (identical(Sys.getenv("NAVE_V191_SELF_TEST"), "1")) {
  executar_testes_estruturais_v191()
}
