// Stand-ins for _config.yml, _news/*.md, _posts/*.md and _bibliography/papers.bib.
window.FOLIO = {
  site: { first: "Hana", middle: "J.", last: "Seo", me: "Seo, H." ,
    contactNote: "연구 협업 문의는 이메일이 가장 빠릅니다." },
  news: [
    { date: "2026-10-20", html: "이미지 복원 논문이 <strong>CVPR 2027</strong> 심사에 들어갔습니다." },
    { date: "2026-08-02", html: "여름 학기 <a href=\"#\">컴퓨터 비전 특강</a> 강의를 마쳤습니다. 🎉" },
    { date: "2026-05-14", html: "모바일 사진 편집 엔진에 관한 워크숍 발표를 했습니다." },
    { date: "2026-02-03", html: "연구실 웹사이트를 정적 사이트로 이전했습니다." }
  ],
  posts: [
    { date: "2026-09-18", title: "BibTeX을 브라우저에서 파싱하기", href: "#" },
    { date: "2026-07-01", title: "다크 모드 3단 토글(system → light → dark)", href: "#" },
    { date: "2026-04-22", title: "논문 목록 검색에 URL 해시를 쓰는 이유", href: "#" }
  ],
  // Raw BibTeX, parsed client-side by folio.js (jekyll-scholar runs this at build time in the original).
  bibtex: String.raw`
@string{ieee = {IEEE}}

@inproceedings{seo2026restore,
  abbr      = {CVPR},
  title     = {Lightweight Diffusion Priors for On-Device Photo Restoration},
  author    = {Seo, Hana and Kim, Minho and Park, Jiwoo},
  booktitle = {Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition},
  year      = {2026},
  abstract  = {We present a compact diffusion prior that restores low-light and noisy smartphone photos in under 200 ms on mobile GPUs, matching server-side quality on standard benchmarks.},
  pdf       = {https://example.com/restore.pdf},
  code      = {https://example.com/code},
  selected  = {true}
}

@article{seo2025curves,
  abbr      = {TOG},
  title     = {Learning Tone Curves from Few Edits},
  author    = {Lee, Sora and Seo, Hana},
  journal   = {ACM Transactions on Graphics},
  volume    = {44},
  number    = {3},
  pages     = {1--14},
  year      = {2025},
  abstract  = {A few-shot method that infers a photographer's tone-curve style from as few as five edited images and applies it consistently to new photos.},
  html      = {https://example.com/curves},
  selected  = {true}
}

@inproceedings{seo2025video,
  abbr      = {ECCV},
  title     = {Temporally Stable Color Grading for Short Videos},
  author    = {Seo, Hana and Choi, Daeun and Lim, Taeyang},
  booktitle = {European Conference on Computer Vision},
  year      = {2025},
  publisher = ieee,
  pdf       = {https://example.com/video.pdf}
}

@article{seo2024survey,
  title     = {A Survey of Mobile Computational Photography Pipelines},
  author    = {Seo, Hana},
  journal   = {Computer Graphics Forum},
  volume    = {43},
  year      = {2024},
  abstract  = {We review capture, fusion and rendering stages of modern smartphone camera pipelines and catalogue open problems.}
}

@misc{seo2023thesis,
  title     = {Perceptual Metrics for Photo Enhancement},
  author    = {Seo, Hana},
  howpublished = {Master's thesis, Example University},
  year      = {2023}
}
`
};
