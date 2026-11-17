// Radarr custom formats (TRaSH Guides) that Elixir's quality policy presets can
// select, converted from elixir-server/src/drivers/quality_policy/radarr_cf/*.json.
// Only the keys the presets read are kept: name, includeCustomFormatWhenRenaming,
// trash_scores and specifications. Keyed by the file's slug.
export default {
  "amzn": {
    "name": "AMZN",
    "includeCustomFormatWhenRenaming": true,
    "specifications": [
      {
        "name": "Amazon",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "\\b(amzn|amazon(hd)?)\\b"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 8
        }
      }
    ]
  },
  "atv": {
    "name": "ATV",
    "includeCustomFormatWhenRenaming": true,
    "specifications": [
      {
        "name": "Apple TV",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "\\b(ATV)\\b"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 8
        }
      }
    ]
  },
  "atvp": {
    "name": "ATVP",
    "includeCustomFormatWhenRenaming": true,
    "specifications": [
      {
        "name": "Apple TV+",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "\\b(atvp|aptv|Apple TV\\+)\\b"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 8
        }
      }
    ]
  },
  "av1": {
    "name": "AV1",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": -10000,
      "sqp-1-2160p": -10000,
      "anime-radarr": -10000,
      "german": -35000,
      "german-anime": -35000
    },
    "specifications": [
      {
        "name": "AV1",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "\\bAV1\\b"
        }
      }
    ]
  },
  "bcore": {
    "name": "BCORE",
    "includeCustomFormatWhenRenaming": true,
    "trash_scores": {
      "default": 15,
      "sqp-1-1080p": -10000,
      "sqp-1-web-1080p": -10000,
      "sqp-1-2160p": -10000,
      "sqp-1-web-2160p": -10000
    },
    "specifications": [
      {
        "name": "Bravia Core",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "\\b(BCORE)\\b|\\b(\\d{3,4}(p|i))\\b.*\\b(CORE)\\b"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 8
        }
      }
    ]
  },
  "br-disk": {
    "name": "BR-DISK",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": -10000,
      "german": -35000,
      "german-anime": -35000
    },
    "specifications": [
      {
        "name": "BR-DISK",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "^(?!.*\\b((?<!HD[._ -]|HD)DVD|BDRip|720p|MKV|XviD|WMV|d3g|(BD)?REMUX|^(?=.*1080p)(?=.*HEVC)|[xh][-_. ]?26[45]|German.*[DM]L|((?<=\\d{4}).*German.*([DM]L)?)(?=.*\\b(AVC|HEVC|VC[-_. ]?1|MVC|MPEG[-_. ]?2)\\b))\\b)(((?=.*\\b(Blu[-_. ]?ray|BD|HD[-_. ]?DVD)\\b)(?=.*\\b(AVC|HEVC|VC[-_. ]?1|MVC|MPEG[-_. ]?2|BDMV|ISO)\\b))|^((?=.*\\b(((?=.*\\b((.*_)?COMPLETE.*|Dis[ck])\\b)(?=.*(Blu[-_. ]?ray|HD[-_. ]?DVD)))|3D[-_. ]?BD|BR[-_. ]?DISK|Full[-_. ]?Blu[-_. ]?ray|^((?=.*((BD|UHD)[-_. ]?(25|50|66|100|ISO)))))))).*"
        }
      }
    ]
  },
  "crit": {
    "name": "CRiT",
    "includeCustomFormatWhenRenaming": true,
    "trash_scores": {
      "default": 20
    },
    "specifications": [
      {
        "name": "CRiT",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "\\b(CRiT)\\b"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 8
        }
      },
      {
        "name": "Not Criterion RlsGrp",
        "implementation": "ReleaseGroupSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": "^(Criterion)$"
        }
      }
    ]
  },
  "dsnp": {
    "name": "DSNP",
    "includeCustomFormatWhenRenaming": true,
    "specifications": [
      {
        "name": "Disney+",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "\\b(dsnp|dsny|disney|Disney\\+)\\b"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 8
        }
      }
    ]
  },
  "dv-boost": {
    "name": "DV Boost",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": 1000,
      "sqp-4-ma-hybrid": 100
    },
    "specifications": [
      {
        "name": "DV",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(dv|dovi|dolby[ .]?v(ision)?)\\b"
        }
      }
    ]
  },
  "dv-wo-hdr-fallback": {
    "name": "DV (w/o HDR fallback)",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": -10000
    },
    "specifications": [
      {
        "name": "Dolby Vision",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "\\b(dv|dovi|dolby[ .]?V(ision)?)\\b"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 8
        }
      },
      {
        "name": "Not RlsGrp",
        "implementation": "ReleaseGroupSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": "\\b(Flights)\\b"
        }
      },
      {
        "name": "Not HDR",
        "implementation": "ReleaseTitleSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": "\\bHDR(\\b|\\d)"
        }
      },
      {
        "name": "Not Hulu",
        "implementation": "ReleaseTitleSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": "\\b(hulu)\\b"
        }
      }
    ]
  },
  "extras": {
    "name": "Extras",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": -10000,
      "german": -35000,
      "german-anime": -35000
    },
    "specifications": [
      {
        "name": "Extras",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "(?<=\\b[12]\\d{3}\\b).*\\b(Extras|Bonus|Extended[ ._-]Clip)\\b"
        }
      }
    ]
  },
  "generated-dynamic-hdr": {
    "name": "Generated Dynamic HDR",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": -10000,
      "german": 0,
      "german-anime": 0
    },
    "specifications": [
      {
        "name": "BiTOR",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(BiTOR)$"
        }
      },
      {
        "name": "DepraveD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(DepraveD)$"
        }
      },
      {
        "name": "Flights",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(Flights)$"
        }
      },
      {
        "name": "GuyZo",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(GuyZo|BR-GuyZo)$"
        }
      },
      {
        "name": "SasukeducK",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(SasukeducK)$"
        }
      },
      {
        "name": "tarunk9c",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(tarunk9c)$"
        }
      },
      {
        "name": "VD0N",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(VD0N)$"
        }
      },
      {
        "name": "VECTOR",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(VECTOR)$"
        }
      },
      {
        "name": "VisionXpert",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(VisionXpert)$"
        }
      },
      {
        "name": "HDR10+",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\bHDR10(\\+|P(lus)?\\b)"
        }
      },
      {
        "name": "DV",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(dv|dovi|dolby[ .]?v(ision)?)\\b"
        }
      }
    ]
  },
  "hbo": {
    "name": "HBO",
    "includeCustomFormatWhenRenaming": true,
    "specifications": [
      {
        "name": "HBO",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(hbo)(?![ ._-]max)\\b(?=[ ._-]web[ ._-]?(dl|rip)\\b)"
        }
      },
      {
        "name": "HBO Rename",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\[(HBO)\\b|\\b(HBO)\\]"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 8
        }
      }
    ]
  },
  "hd-bluray-tier-01": {
    "name": "HD Bluray Tier 01",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": 1800,
      "sqp-1-1080p": 1100,
      "sqp-1-web-1080p": 1100,
      "sqp-1-2160p": 1100,
      "sqp-1-web-2160p": 1100,
      "french-multi-vf": 0,
      "german-anime": 1050
    },
    "specifications": [
      {
        "name": "BLURAY",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": 9
        }
      },
      {
        "name": "Not REMUX",
        "implementation": "QualityModifierSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": 5
        }
      },
      {
        "name": "Not 2160p",
        "implementation": "ResolutionSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": 2160
        }
      },
      {
        "name": "BBQ",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(BBQ)$"
        }
      },
      {
        "name": "BMF",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(BMF)$"
        }
      },
      {
        "name": "c0kE",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(c0kE)$"
        }
      },
      {
        "name": "Chotab",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(Chotab)$"
        }
      },
      {
        "name": "CRiSC",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(CRiSC)$"
        }
      },
      {
        "name": "CtrlHD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(CtrlHD)$"
        }
      },
      {
        "name": "D-Z0N3",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(D-Z0N3)$"
        }
      },
      {
        "name": "Dariush",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(Dariush)$"
        }
      },
      {
        "name": "decibeL",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(decibeL)$"
        }
      },
      {
        "name": "DON",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(DON)$"
        }
      },
      {
        "name": "EbP",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(EbP)$"
        }
      },
      {
        "name": "EDPH",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(EDPH)$"
        }
      },
      {
        "name": "Geek",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(Geek)$"
        }
      },
      {
        "name": "LolHD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(LolHD)$"
        }
      },
      {
        "name": "NCmt",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(NCmt)$"
        }
      },
      {
        "name": "PTer",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(PTer)$"
        }
      },
      {
        "name": "TayTO",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(TayTO)$"
        }
      },
      {
        "name": "TDD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(TDD)$"
        }
      },
      {
        "name": "TnP",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(TnP)$"
        }
      },
      {
        "name": "VietHD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(VietHD)$"
        }
      },
      {
        "name": "ZQ",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(ZQ)$"
        }
      },
      {
        "name": "ZoroSenpai",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(ZoroSenpai)$"
        }
      }
    ]
  },
  "hd-bluray-tier-02": {
    "name": "HD Bluray Tier 02",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": 1750,
      "sqp-1-1080p": 1050,
      "sqp-1-web-1080p": 1050,
      "sqp-1-2160p": 1050,
      "sqp-1-web-2160p": 1050,
      "french-multi-vf": 0,
      "german-anime": 1000
    },
    "specifications": [
      {
        "name": "BLURAY",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": 9
        }
      },
      {
        "name": "Not REMUX",
        "implementation": "QualityModifierSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": 5
        }
      },
      {
        "name": "Not 2160p",
        "implementation": "ResolutionSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": 2160
        }
      },
      {
        "name": "ATELiER",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(ATELiER)$"
        }
      },
      {
        "name": "EA",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(EA)$"
        }
      },
      {
        "name": "HiDt",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(HiDt)$"
        }
      },
      {
        "name": "HiSD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(HiSD)$"
        }
      },
      {
        "name": "iFT",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(iFT)$"
        }
      },
      {
        "name": "NTb",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(NTb)$"
        }
      },
      {
        "name": "QOQ",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(QOQ)$"
        }
      },
      {
        "name": "SA89",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(SA89)$"
        }
      },
      {
        "name": "sbR",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(sbR)$"
        }
      }
    ]
  },
  "hd-bluray-tier-03": {
    "name": "HD Bluray Tier 03",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": 1700,
      "sqp-1-1080p": 1000,
      "sqp-1-web-1080p": 1000,
      "sqp-1-2160p": 1000,
      "sqp-1-web-2160p": 1000,
      "french-multi-vf": 0,
      "german-anime": 950
    },
    "specifications": [
      {
        "name": "BLURAY",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": 9
        }
      },
      {
        "name": "Not REMUX",
        "implementation": "QualityModifierSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": 5
        }
      },
      {
        "name": "Not 2160p",
        "implementation": "ResolutionSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": 2160
        }
      },
      {
        "name": "BHDStudio",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(BHDStudio)$"
        }
      },
      {
        "name": "hallowed",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(hallowed)$"
        }
      },
      {
        "name": "HiFi",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(HiFi)$"
        }
      },
      {
        "name": "HONE",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(HONE)$"
        }
      },
      {
        "name": "LoRD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(LoRD)$"
        }
      },
      {
        "name": "playHD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(playHD)$"
        }
      },
      {
        "name": "SPHD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(SPHD)$"
        }
      },
      {
        "name": "W4NK3R",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(W4NK3R)$"
        }
      }
    ]
  },
  "hdr": {
    "name": "HDR",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": 500,
      "sqp-4-ma-hybrid": 200
    },
    "specifications": [
      {
        "name": "DV With HDR10 fallback",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(?=.*\\b(dv|dovi|dolby[ .]?v(ision)?)\\b)(?!(?=.*\\b(WEB[ ._-]?(DL|Rip)?)\\b)(?!.*\\b(hulu)\\b))"
        }
      },
      {
        "name": "HDR",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(HDR)\\b"
        }
      },
      {
        "name": "HDR10",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(HDR10(?![+]|P(lus)?))"
        }
      },
      {
        "name": "HDR10+",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(HDR10(?=[+]|P(lus)?))"
        }
      },
      {
        "name": "HLG",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(HLG)\\b"
        }
      },
      {
        "name": "PQ",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(PQ)\\b"
        }
      },
      {
        "name": "RlsGrp (Missing HDR)",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(?=.*\\b(FraMeSToR|HQMUX|SiCFoI)\\b)(?=.*\\b(2160p)\\b)(?!.*\\b(HDR10([+]|P(lus)?)))(?!.*\\b(SDR)\\b).*"
        }
      }
    ]
  },
  "hdr10plus-boost": {
    "name": "HDR10+ Boost",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": 100,
      "sqp-4-ma-hybrid": 1
    },
    "specifications": [
      {
        "name": "HDR10+",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(HDR10(?=[+]|P(lus)?))"
        }
      }
    ]
  },
  "hmax": {
    "name": "HMAX",
    "includeCustomFormatWhenRenaming": true,
    "specifications": [
      {
        "name": "HBO Max",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(hmax|hbom|hbo[ ._-]?max)\\b(?=[ ._-]web[ ._-]?(dl|rip)\\b)"
        }
      },
      {
        "name": "HMAX Rename",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\[(HMAX)\\b|\\b(HMAX)\\]"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 8
        }
      }
    ]
  },
  "hulu": {
    "name": "Hulu",
    "includeCustomFormatWhenRenaming": true,
    "specifications": [
      {
        "name": "Hulu",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "\\b(hulu)\\b"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 8
        }
      }
    ]
  },
  "it": {
    "name": "iT",
    "includeCustomFormatWhenRenaming": true,
    "specifications": [
      {
        "name": "iTunes",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(it|itunes)\\b(?=[ ._-]web[ ._-]?(dl|rip)\\b)"
        }
      },
      {
        "name": "iT Rename",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\[(iT)(?![+])\\b|\\b(?<![+])(iT)\\]"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 8
        }
      }
    ]
  },
  "lq": {
    "name": "LQ",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": -10000,
      "german": -35000,
      "german-anime": -35000
    },
    "specifications": [
      {
        "name": "24xHD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(24xHD)\\b"
        }
      },
      {
        "name": "41RGB",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(41RGB)$"
        }
      },
      {
        "name": "4K4U",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(4K4U)$"
        }
      },
      {
        "name": "AOC",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(AOC)$"
        }
      },
      {
        "name": "AROMA",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(AROMA)$"
        }
      },
      {
        "name": "aXXo",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(aXXo)$"
        }
      },
      {
        "name": "AZAZE",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(AZAZE)$"
        }
      },
      {
        "name": "BARC0DE",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(BARC0DE)$"
        }
      },
      {
        "name": "BAUCKLEY",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(BAUCKLEY)$"
        }
      },
      {
        "name": "BdC",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(BdC)$"
        }
      },
      {
        "name": "beAst",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(beAst)$"
        }
      },
      {
        "name": "BTM",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(BTM)$"
        }
      },
      {
        "name": "C1NEM4",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(C1NEM4)$"
        }
      },
      {
        "name": "C4K",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(C4K)$"
        }
      },
      {
        "name": "CDDHD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(CDDHD)$"
        }
      },
      {
        "name": "CHAOS",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(CHAOS)$"
        }
      },
      {
        "name": "CHD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(CHD)$"
        }
      },
      {
        "name": "CiNE",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(CiNE)$"
        }
      },
      {
        "name": "COLLECTiVE",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(COLLECTiVE)$"
        }
      },
      {
        "name": "CREATiVE24",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(CREATiVE24)$"
        }
      },
      {
        "name": "CrEwSaDe",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(CrEwSaDe)$"
        }
      },
      {
        "name": "CTFOH",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(CTFOH)$"
        }
      },
      {
        "name": "d3g",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(d3g)$"
        }
      },
      {
        "name": "DDR",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(DDR)$"
        }
      },
      {
        "name": "DNL",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(DNL)$"
        }
      },
      {
        "name": "DRX",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(DRX)$"
        }
      },
      {
        "name": "E",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(E)$"
        }
      },
      {
        "name": "EPiC",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(EPiC)$"
        }
      },
      {
        "name": "EuReKA",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(EuReKA)$"
        }
      },
      {
        "name": "FaNGDiNG0",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(FaNGDiNG0)$"
        }
      },
      {
        "name": "Feranki1980",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(Feranki1980)$"
        }
      },
      {
        "name": "FGT",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(FGT)$"
        }
      },
      {
        "name": "FMD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(FMD)$"
        }
      },
      {
        "name": "FRDS",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(FRDS)$"
        }
      },
      {
        "name": "FZHD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(FZHD)$"
        }
      },
      {
        "name": "GalaxyRG",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(GalaxyRG)$"
        }
      },
      {
        "name": "GHD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(GHD)$"
        }
      },
      {
        "name": "GPTHD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(GPTHD)$"
        }
      },
      {
        "name": "HDHUB4U",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(HDHUB4U)$"
        }
      },
      {
        "name": "HDS",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(HDS)$"
        }
      },
      {
        "name": "HDT",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(HDT)$"
        }
      },
      {
        "name": "HDTime",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(HDTime)$"
        }
      },
      {
        "name": "HDWinG",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(HDWinG)$"
        }
      },
      {
        "name": "iNTENSO",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(iNTENSO)$"
        }
      },
      {
        "name": "iPlanet",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(iPlanet)$"
        }
      },
      {
        "name": "iVy",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(iVy)$"
        }
      },
      {
        "name": "jennaortega",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(jennaortega(UHD)?)$"
        }
      },
      {
        "name": "JFF",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(JFF)$"
        }
      },
      {
        "name": "KC",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(KC)$"
        }
      },
      {
        "name": "KiNGDOM",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(KiNGDOM)$"
        }
      },
      {
        "name": "KIRA",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(KIRA)$"
        }
      },
      {
        "name": "L0SERNIGHT",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(L0SERNIGHT)$"
        }
      },
      {
        "name": "LAMA",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(LAMA)$"
        }
      },
      {
        "name": "Leffe",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(Leffe)$"
        }
      },
      {
        "name": "Liber8",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(Liber8)$"
        }
      },
      {
        "name": "LiGaS",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(LiGaS)$"
        }
      },
      {
        "name": "LUCY",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(LUCY)$"
        }
      },
      {
        "name": "MarkII",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(MarkII)$"
        }
      },
      {
        "name": "MeGusta",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(MeGusta)$"
        }
      },
      {
        "name": "Mesc",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(Mesc)$"
        }
      },
      {
        "name": "mHD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(mHD)$"
        }
      },
      {
        "name": "mSD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(mSD)$"
        }
      },
      {
        "name": "MTeam",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(MTeam|MT)$"
        }
      },
      {
        "name": "MySiLU",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(MySiLU)$"
        }
      },
      {
        "name": "NhaNc3",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(NhaNc3)$"
        }
      },
      {
        "name": "nHD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(nHD)$"
        }
      },
      {
        "name": "nikt0",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(nikt0)$"
        }
      },
      {
        "name": "NoGroup",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "NoGr(ou)?p"
        }
      },
      {
        "name": "nSD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(nSD)$"
        }
      },
      {
        "name": "OFT",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(OFT)$"
        }
      },
      {
        "name": "Pahe",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "Pahe(\\.(ph|in))?\\b"
        }
      },
      {
        "name": "PATOMiEL",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(PATOMiEL)$"
        }
      },
      {
        "name": "PRODJi",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(PRODJi)$"
        }
      },
      {
        "name": "PSA",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(PSA)$"
        }
      },
      {
        "name": "PTNK",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(PTNK)$"
        }
      },
      {
        "name": "R&H",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(R&H)$"
        }
      },
      {
        "name": "RARBG",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(RARBG)$"
        }
      },
      {
        "name": "RDN",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(RDN)$"
        }
      },
      {
        "name": "RiffTrax",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(Rifftrax)$"
        }
      },
      {
        "name": "RU4HD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(RU4HD)$"
        }
      },
      {
        "name": "SANTi",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(SANTi)$"
        }
      },
      {
        "name": "Scene",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(Scene)$"
        }
      },
      {
        "name": "SHD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(SHD)$"
        }
      },
      {
        "name": "ShieldBearer",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(ShieldBearer)$"
        }
      },
      {
        "name": "STUTTERSHIT",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(STUTTERSHIT)$"
        }
      },
      {
        "name": "SUNSCREEN",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(SUNSCREEN)$"
        }
      },
      {
        "name": "TBS",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(TBS)$"
        }
      },
      {
        "name": "TEKNO3D",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(TEKNO3D)$"
        }
      },
      {
        "name": "Tigole",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(Tigole)$"
        }
      },
      {
        "name": "TIKO",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(TIKO)$"
        }
      },
      {
        "name": "VISIONPLUSHDR",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(VISIONPLUSHDR(-X|1000)?)$"
        }
      },
      {
        "name": "WAF",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(WAF)$"
        }
      },
      {
        "name": "WiKi",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(WiKi)$"
        }
      },
      {
        "name": "x0r",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(x0r)$"
        }
      },
      {
        "name": "YIFY",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(YIFY)$"
        }
      },
      {
        "name": "YTS",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(YTS(.(MX|LT|AG))?)$"
        }
      },
      {
        "name": "Zeus",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(Zeus)$"
        }
      }
    ]
  },
  "lq-release-title": {
    "name": "LQ (Release Title)",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": -10000,
      "german": -35000,
      "german-anime": -35000
    },
    "specifications": [
      {
        "name": "1XBET",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(1XBET)\\b"
        }
      },
      {
        "name": "BEN THE MEN",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(BEN[ ._-]THE[ ._-]MEN)\\b"
        }
      },
      {
        "name": "D3US",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "(-D3US|D3US-)"
        }
      },
      {
        "name": "EVO (no WEBDL)",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "(?<=\\b[12]\\d{3}\\b.*?)(?<!\\b(web[ ._-]?(dl|rip)?).*?)\\b(EVO)\\b"
        }
      },
      {
        "name": "Feranki1980",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(Feranki1980)\\b"
        }
      },
      {
        "name": "GalaxyRG",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(GalaxyRG)\\b"
        }
      },
      {
        "name": "HHWEB (No MA)",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(?!.*\\bMA\\b.*\\bWEB-?DL\\b).*\\b(HHWEB)\\b"
        }
      },
      {
        "name": "jennaortega",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "(?<!-)\\b(jennaortega(UHD)?)\\b"
        }
      },
      {
        "name": "PiRaTeS (no WEBDL)",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "(?<=\\b[12]\\d{3}\\b.*?)(?<!\\b(web[ ._-]?(dl|rip)?).*?)\\b(PiRaTeS)\\b"
        }
      },
      {
        "name": "READ NOTE",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(READ(\\s|\\.)+NOTE)\\b"
        }
      },
      {
        "name": "SWTYBLZ",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(SWTYBLZ)\\b"
        }
      },
      {
        "name": "TeeWee",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(TeeWee)\\b"
        }
      },
      {
        "name": "TEKNO3D",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(TEKNO3D)\\b"
        }
      },
      {
        "name": "UnKn0wn (NoRemux)",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "(?<!\\b(remux).*?)\\b(unkn0wn)\\b"
        }
      },
      {
        "name": "Will1869",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(Will1869)\\b"
        }
      }
    ]
  },
  "ma": {
    "name": "MA",
    "includeCustomFormatWhenRenaming": true,
    "trash_scores": {
      "default": 20,
      "sqp-4-ma-hybrid": 350
    },
    "specifications": [
      {
        "name": "Movies Anywhere",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "(?<!dts[ .-]?hd[ .-]?)\\b(ma|ykw)\\b(?=.*\\bweb[ ._-]?(dl|rip)\\b)"
        }
      }
    ]
  },
  "max": {
    "name": "MAX",
    "includeCustomFormatWhenRenaming": true,
    "specifications": [
      {
        "name": "Max",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b((?<!hbo[ ._-])max)\\b(?=[ ._-]web[ ._-]?(dl|rip)\\b)"
        }
      },
      {
        "name": "MAX Rename",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\[(MAX)\\b|\\b(MAX)\\]"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 8
        }
      }
    ]
  },
  "nf": {
    "name": "NF",
    "includeCustomFormatWhenRenaming": true,
    "specifications": [
      {
        "name": "Netflix",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "\\b(nf|netflix(u?hd)?)\\b"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 8
        }
      }
    ]
  },
  "pcok": {
    "name": "PCOK",
    "includeCustomFormatWhenRenaming": true,
    "specifications": [
      {
        "name": "Peacock TV",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "\\b(pcok|peacock)\\b"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 8
        }
      }
    ]
  },
  "play": {
    "name": "PLAY",
    "includeCustomFormatWhenRenaming": true,
    "trash_scores": {
      "sqp-4-ma-hybrid": 350
    },
    "specifications": [
      {
        "name": "PLAY",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(Play)\\b(?=[ ._-]web[ ._-]?(dl|rip)\\b)"
        }
      },
      {
        "name": "PLAY Rename",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\[(Play)\\b|\\b(Play)\\]"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 8
        }
      }
    ]
  },
  "pmtp": {
    "name": "PMTP",
    "includeCustomFormatWhenRenaming": true,
    "specifications": [
      {
        "name": "Paramount+",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "\\b(pmtp|Paramount Plus)\\b"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 8
        }
      }
    ]
  },
  "repack-proper": {
    "name": "Repack/Proper",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": 5,
      "anime-radarr": 1,
      "french-anime-multi": 1,
      "french-anime-vostfr": 1,
      "sqp-4-ma-hybrid": 1
    },
    "specifications": [
      {
        "name": "Repack/Proper/Rerip",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "\\b(Repack|Proper|Rerip)\\b"
        }
      },
      {
        "name": "Not Higher Version Repack/Proper",
        "implementation": "ReleaseTitleSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": "\\b((repack|proper)[23])\\b|\\bREAL\\.(REAL\\.)?(PROPER|REPACK)\\b"
        }
      }
    ]
  },
  "repack2": {
    "name": "Repack2",
    "includeCustomFormatWhenRenaming": true,
    "trash_scores": {
      "default": 6,
      "anime-radarr": 2,
      "french-anime-multi": 2,
      "french-anime-vostfr": 2,
      "sqp-4-ma-hybrid": 2
    },
    "specifications": [
      {
        "name": "Repack/Proper 2 or REAL.PROPER/REPACK",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "\\b((repack|proper)2)\\b|\\b(REAL\\.(PROPER|REPACK))\\b"
        }
      },
      {
        "name": "Not Repack/Proper 3",
        "implementation": "ReleaseTitleSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": "\\b((repack|proper)3)\\b|\\bREAL\\.(REAL\\.)(PROPER|REPACK)\\b"
        }
      }
    ]
  },
  "repack3": {
    "name": "Repack3",
    "includeCustomFormatWhenRenaming": true,
    "trash_scores": {
      "default": 7,
      "anime-radarr": 3,
      "french-anime-multi": 3,
      "french-anime-vostfr": 3,
      "sqp-4-ma-hybrid": 3
    },
    "specifications": [
      {
        "name": "Repack/Proper 3 or REAL.REAL.PROPER/REPACK",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "\\b((repack|proper)3)\\b|\\b(REAL\\.REAL\\.(PROPER|REPACK))\\b"
        }
      }
    ]
  },
  "roku": {
    "name": "ROKU",
    "includeCustomFormatWhenRenaming": true,
    "specifications": [
      {
        "name": "ROKU",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "\\b(ROKU)\\b"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 8
        }
      }
    ]
  },
  "stan": {
    "name": "STAN",
    "includeCustomFormatWhenRenaming": true,
    "specifications": [
      {
        "name": "Stan",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(stan)\\b[ ._-]web[ ._-]?(dl|rip)?\\b"
        }
      },
      {
        "name": "Stan Rename",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\[(STAN)\\b|\\b(STAN)\\]"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 8
        }
      }
    ]
  },
  "uhd-bluray-tier-01": {
    "name": "UHD Bluray Tier 01",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": 1800,
      "sqp-1-2160p": 1100,
      "sqp-1-web-2160p": 1100,
      "sqp-2": 2300,
      "sqp-5": 2300,
      "french-multi-vf": 0
    },
    "specifications": [
      {
        "name": "Not REMUX",
        "implementation": "QualityModifierSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": 5
        }
      },
      {
        "name": "Not WEBDL",
        "implementation": "SourceSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "Not WEBRIP",
        "implementation": "SourceSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": 8
        }
      },
      {
        "name": "2160p",
        "implementation": "ResolutionSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": 2160
        }
      },
      {
        "name": "CtrlHD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(CtrlHD)$"
        }
      },
      {
        "name": "MainFrame",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(MainFrame)$"
        }
      },
      {
        "name": "DON",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(DON)$"
        }
      },
      {
        "name": "W4NK3R",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(W4NK3R)$"
        }
      }
    ]
  },
  "uhd-bluray-tier-02": {
    "name": "UHD Bluray Tier 02",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": 1750,
      "sqp-1-2160p": 1050,
      "sqp-1-web-2160p": 1050,
      "sqp-2": 2200,
      "sqp-5": 2200,
      "french-multi-vf": 0
    },
    "specifications": [
      {
        "name": "Not REMUX",
        "implementation": "QualityModifierSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": 5
        }
      },
      {
        "name": "Not WEBDL",
        "implementation": "SourceSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "Not WEBRIP",
        "implementation": "SourceSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": 8
        }
      },
      {
        "name": "2160p",
        "implementation": "ResolutionSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": 2160
        }
      },
      {
        "name": "HQMUX",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(HQMUX)$"
        }
      }
    ]
  },
  "uhd-bluray-tier-03": {
    "name": "UHD Bluray Tier 03",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": 1700,
      "sqp-1-2160p": 1000,
      "sqp-1-web-2160p": 1000,
      "sqp-2": 2100,
      "sqp-5": 2100,
      "french-multi-vf": 0
    },
    "specifications": [
      {
        "name": "Not REMUX",
        "implementation": "QualityModifierSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": 5
        }
      },
      {
        "name": "Not WEBDL",
        "implementation": "SourceSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "Not WEBRIP",
        "implementation": "SourceSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": 8
        }
      },
      {
        "name": "2160p",
        "implementation": "ResolutionSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": 2160
        }
      },
      {
        "name": "BHDStudio",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(BHDStudio)$"
        }
      },
      {
        "name": "hallowed",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(hallowed)$"
        }
      },
      {
        "name": "HONE",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(HONE)$"
        }
      },
      {
        "name": "PTer",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(PTer)$"
        }
      },
      {
        "name": "SPHD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(SPHD)$"
        }
      },
      {
        "name": "WEBDV",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(WEBDV)$"
        }
      }
    ]
  },
  "web-tier-01": {
    "name": "WEB Tier 01",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": 1700,
      "sqp-4-ma-hybrid": 30,
      "french-multi-vf": 0,
      "german-anime": 350
    },
    "specifications": [
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 8
        }
      },
      {
        "name": "ABBIE",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(ABBIE)$"
        }
      },
      {
        "name": "AJP69",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(AJP69)$"
        }
      },
      {
        "name": "APEX",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(APEX|PAXA|PEXA|XEPA)$"
        }
      },
      {
        "name": "BLUTONiUM",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(BLUTONiUM)$"
        }
      },
      {
        "name": "BYNDR",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(BYNDR)$"
        }
      },
      {
        "name": "CMRG",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(CMRG)$"
        }
      },
      {
        "name": "CRFW",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(CRFW)$"
        }
      },
      {
        "name": "CRUD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(CRUD)$"
        }
      },
      {
        "name": "FLUX",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(FLUX)$"
        }
      },
      {
        "name": "GNOME",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(GNOME)$"
        }
      },
      {
        "name": "HONE",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(HONE)$"
        }
      },
      {
        "name": "KiNGS",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(KiNGS)$"
        }
      },
      {
        "name": "Kitsune",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(Kitsune)$"
        }
      },
      {
        "name": "NOSiViD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(NOSiViD)$"
        }
      },
      {
        "name": "NTb",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(NTb)$"
        }
      },
      {
        "name": "NTG",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(NTG)$"
        }
      },
      {
        "name": "RAWR",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(RAWR)$"
        }
      },
      {
        "name": "SiC",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(SiC)$"
        }
      },
      {
        "name": "TEPES",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(TEPES)$"
        }
      },
      {
        "name": "TheFarm",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(TheFarm)$"
        }
      },
      {
        "name": "ZoroSenpai",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(ZoroSenpai)$"
        }
      }
    ]
  },
  "web-tier-02": {
    "name": "WEB Tier 02",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": 1650,
      "french-multi-vf": 0,
      "sqp-4-ma-hybrid": 20,
      "german-anime": 250
    },
    "specifications": [
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 8
        }
      },
      {
        "name": "dB",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(dB)$"
        }
      },
      {
        "name": "Flights",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(Flights)$"
        }
      },
      {
        "name": "MiU",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(MiU)$"
        }
      },
      {
        "name": "monkee",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(monkee)$"
        }
      },
      {
        "name": "MZABI",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(MZABI)$"
        }
      },
      {
        "name": "PHOENiX",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(PHOENiX)$"
        }
      },
      {
        "name": "playWEB",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(playWEB)$"
        }
      },
      {
        "name": "SbR",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(SbR)$"
        }
      },
      {
        "name": "SMURF",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(SMURF)$"
        }
      },
      {
        "name": "TOMMY",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(TOMMY)$"
        }
      },
      {
        "name": "XEBEC",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(XEBEC|4KBEC|CEBEX)$"
        }
      }
    ]
  },
  "web-tier-03": {
    "name": "WEB Tier 03",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": 1600,
      "sqp-4-ma-hybrid": 10,
      "french-multi-vf": 0,
      "german-anime": 150
    },
    "specifications": [
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 7
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 8
        }
      },
      {
        "name": "BLOOM",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(BLOOM)$"
        }
      },
      {
        "name": "Dooky",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(Dooky)$"
        }
      },
      {
        "name": "GNOMiSSiON",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(GNOMiSSiON)$"
        }
      },
      {
        "name": "HHWEB",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(HHWEB)$"
        }
      },
      {
        "name": "NINJACENTRAL",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(NINJACENTRAL)$"
        }
      },
      {
        "name": "NPMS",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(NPMS)$"
        }
      },
      {
        "name": "ROCCaT",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(ROCCaT)$"
        }
      },
      {
        "name": "SiGMA",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(SiGMA)$"
        }
      },
      {
        "name": "SLiGNOME",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(SLiGNOME)$"
        }
      },
      {
        "name": "SwAgLaNdEr",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(SwAgLaNdEr)$"
        }
      }
    ]
  },
  "x265-hd": {
    "name": "x265 (HD)",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": -10000,
      "german": 0,
      "german-anime": 0
    },
    "specifications": [
      {
        "name": "x265/HEVC",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "[xh][ ._-]?265|\\bHEVC(\\b|\\d)"
        }
      },
      {
        "name": "Not 2160p",
        "implementation": "ResolutionSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": 2160
        }
      }
    ]
  },
  "x265-no-hdrdv": {
    "name": "x265 (no HDR/DV)",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": -10000,
      "german": -35000,
      "german-anime": -35000
    },
    "specifications": [
      {
        "name": "x265/HEVC",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "[xh][ ._-]?265|\\bHEVC(\\b|\\d)"
        }
      },
      {
        "name": "Not HDR/DV",
        "implementation": "ReleaseTitleSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": "\\b(dv|dovi|dolby[ .]?v(ision)?|hdr(10(P(lus)?)?)?|pq)\\b"
        }
      },
      {
        "name": "Not 2160p",
        "implementation": "ResolutionSpecification",
        "negate": true,
        "required": true,
        "fields": {
          "value": 2160
        }
      }
    ]
  },
};
