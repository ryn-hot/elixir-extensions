// Sonarr custom formats (TRaSH Guides) that Elixir's quality policy presets can
// select, converted from elixir-server/src/drivers/quality_policy/sonarr_cf/*.json.
// Only the keys the presets read are kept: name, includeCustomFormatWhenRenaming,
// trash_scores and specifications. Keyed by the file's slug.
export default {
  "amzn": {
    "name": "AMZN",
    "includeCustomFormatWhenRenaming": true,
    "trash_scores": {
      "default": 75,
      "anime-sonarr": 3,
      "french-anime-multi": 3,
      "french-anime-vostfr": 3,
      "german-anime": 0
    },
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
          "value": 3
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 4
        }
      }
    ]
  },
  "atvp": {
    "name": "ATVP",
    "includeCustomFormatWhenRenaming": true,
    "trash_scores": {
      "default": 75,
      "german-anime": 0
    },
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
          "value": 3
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 4
        }
      }
    ]
  },
  "av1": {
    "name": "AV1",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": -10000,
      "anime-sonarr": -10000,
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
  "cc": {
    "name": "CC",
    "includeCustomFormatWhenRenaming": true,
    "trash_scores": {
      "default": 75
    },
    "specifications": [
      {
        "name": "Comedy Central",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(CC)\\b[ ._-]web[ ._-]?(dl|rip)?\\b"
        }
      },
      {
        "name": "CC Rename",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\[(CC)\\b|\\b(CC)\\]"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 3
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 4
        }
      }
    ]
  },
  "dcu": {
    "name": "DCU",
    "includeCustomFormatWhenRenaming": true,
    "trash_scores": {
      "default": 75
    },
    "specifications": [
      {
        "name": "DC Universe",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "\\b(dcu|DC Universe)\\b"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 3
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 4
        }
      }
    ]
  },
  "dscp": {
    "name": "DSCP",
    "includeCustomFormatWhenRenaming": true,
    "trash_scores": {
      "default": 75
    },
    "specifications": [
      {
        "name": "Discovery+",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b((dscp|dcp|disc)\\b|dscv\\+?)[ ._-]web[ ._-]?(dl|rip)?\\b"
        }
      },
      {
        "name": "DSCP Rename",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\[(DSCP)\\b|\\b(DSCP)\\]"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 3
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 4
        }
      }
    ]
  },
  "dsnp": {
    "name": "DSNP",
    "includeCustomFormatWhenRenaming": true,
    "trash_scores": {
      "default": 75,
      "anime-sonarr": 5,
      "french-anime-multi": 5,
      "french-anime-vostfr": 5,
      "german-anime": 0
    },
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
          "value": 3
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 4
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
          "value": "(?<=\\bS\\d+\\b).*\\b(Extras|Bonus|Extended[ ._-]Clip)\\b"
        }
      }
    ]
  },
  "hbo": {
    "name": "HBO",
    "includeCustomFormatWhenRenaming": true,
    "trash_scores": {
      "default": 75,
      "german-anime": 0
    },
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
          "value": 3
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 4
        }
      }
    ]
  },
  "hd-streaming-boost": {
    "name": "HD Streaming Boost",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": 75
    },
    "specifications": [
      {
        "name": "Disney+",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
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
          "value": 3
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 4
        }
      },
      {
        "name": "1080p",
        "implementation": "ResolutionSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": 1080
        }
      }
    ]
  },
  "hdr": {
    "name": "HDR",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": 500
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
  "hmax": {
    "name": "HMAX",
    "includeCustomFormatWhenRenaming": true,
    "trash_scores": {
      "default": 75,
      "german-anime": 0
    },
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
          "value": 3
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 4
        }
      }
    ]
  },
  "hulu": {
    "name": "HULU",
    "includeCustomFormatWhenRenaming": true,
    "trash_scores": {
      "default": 75
    },
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
          "value": 3
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 4
        }
      }
    ]
  },
  "it": {
    "name": "iT",
    "includeCustomFormatWhenRenaming": true,
    "trash_scores": {
      "default": 75
    },
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
          "value": 3
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 4
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
        "name": "BRiNK",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(BRiNK)$"
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
        "name": "CHX",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(CHX)$"
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
        "name": "DepraveD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(DepraveD)$"
        }
      },
      {
        "name": "EVO",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(EVO)$"
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
        "name": "GHOSTS",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(GHOSTS)$"
        }
      },
      {
        "name": "HiQVE",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(HiQVE)$"
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
        "name": "iVy",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(iVy)$"
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
        "name": "MeGusta",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(MeGusta)$"
        }
      },
      {
        "name": "nhanc3",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(nhanc3)$"
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
        "name": "PSA",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(PSA)$"
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
        "name": "SasukeducK",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(SasukeducK)$"
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
        "name": "TBS",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(TBS)$"
        }
      },
      {
        "name": "TG",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(TG)$"
        }
      },
      {
        "name": "VIDEOHOLE",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(VIDEOHOLE)$"
        }
      },
      {
        "name": "worldmkv",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(worldmkv)$"
        }
      },
      {
        "name": "XLF",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(XLF)$"
        }
      },
      {
        "name": "Zero00",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(Zero00)$"
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
        "name": "BEN THE MEN",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(BEN[ ._-]THE[ ._-]MEN)\\b"
        }
      },
      {
        "name": "BiTOR (2160p)",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "(?=.*?(\\b2160p\\b))(?=.*?(\\bBiTOR\\b))"
        }
      },
      {
        "name": "CREATiVE24",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(CREATiVE24)\\b"
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
        "name": "TeeWee",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(TeeWee)\\b"
        }
      }
    ]
  },
  "max": {
    "name": "MAX",
    "includeCustomFormatWhenRenaming": true,
    "trash_scores": {
      "default": 75,
      "german-anime": 0
    },
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
          "value": 3
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 4
        }
      }
    ]
  },
  "nf": {
    "name": "NF",
    "includeCustomFormatWhenRenaming": true,
    "trash_scores": {
      "default": 75,
      "anime-sonarr": 4,
      "french-anime-multi": 4,
      "french-anime-vostfr": 4,
      "german-anime": 0
    },
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
          "value": 3
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 4
        }
      }
    ]
  },
  "pcok": {
    "name": "PCOK",
    "includeCustomFormatWhenRenaming": true,
    "trash_scores": {
      "default": 75
    },
    "specifications": [
      {
        "name": "Peacock TV",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "\\b(pcok|Peacock TV)\\b"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 3
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 4
        }
      }
    ]
  },
  "pmtp": {
    "name": "PMTP",
    "includeCustomFormatWhenRenaming": true,
    "trash_scores": {
      "default": 75
    },
    "specifications": [
      {
        "name": "Paramount+",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "\\b(pmtp|Paramount\\+)\\b"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 3
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 4
        }
      }
    ]
  },
  "repack-proper": {
    "name": "Repack/Proper",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": 5,
      "anime-sonarr": 1,
      "french-anime-multi": 1,
      "french-anime-vostfr": 1
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
      "anime-sonarr": 2,
      "french-anime-multi": 2,
      "french-anime-vostfr": 2
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
      "anime-sonarr": 3,
      "french-anime-multi": 3,
      "french-anime-vostfr": 3
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
  "sho": {
    "name": "SHO",
    "includeCustomFormatWhenRenaming": true,
    "trash_scores": {
      "default": 75
    },
    "specifications": [
      {
        "name": "SHOWTIME",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(sho|showtime)\\b[ ._-]web[ ._-]?(dl|rip)?\\b"
        }
      },
      {
        "name": "SHO Rename",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\[(SHO)\\b|\\b(SHO)\\]"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 3
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 4
        }
      }
    ]
  },
  "stan": {
    "name": "STAN",
    "includeCustomFormatWhenRenaming": true,
    "trash_scores": {
      "default": 75
    },
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
          "value": 3
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 4
        }
      }
    ]
  },
  "syfy": {
    "name": "SYFY",
    "includeCustomFormatWhenRenaming": true,
    "trash_scores": {
      "default": 75
    },
    "specifications": [
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 3
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 4
        }
      },
      {
        "name": "SYFY",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": true,
        "fields": {
          "value": "\\b(SYFY)\\b"
        }
      }
    ]
  },
  "uhd-streaming-boost": {
    "name": "UHD Streaming Boost",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": 75
    },
    "specifications": [
      {
        "name": "Disney+",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "\\b(dsnp|dsny|disney|Disney\\+)\\b"
        }
      },
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
        "name": "Netflix",
        "implementation": "ReleaseTitleSpecification",
        "negate": false,
        "required": false,
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
          "value": 3
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 4
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
      }
    ]
  },
  "web-scene": {
    "name": "WEB Scene",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": 1600,
      "french-multi-vf": 0
    },
    "specifications": [
      {
        "name": "DEFLATE",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(DEFLATE)$"
        }
      },
      {
        "name": "INFLATE",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(INFLATE)$"
        }
      }
    ]
  },
  "web-tier-01": {
    "name": "WEB Tier 01",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": 1700,
      "french-multi-vf": 0,
      "german-anime": 350
    },
    "specifications": [
      {
        "name": "ABBiE",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(ABBiE)$"
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
        "name": "CasStudio",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(CasStudio)$"
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
        "name": "CtrlHD",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(CtrlHD)$"
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
        "name": "monkee",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(monkee)$"
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
        "name": "QOQ",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(QOQ)$"
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
        "name": "RTN",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(RTN)$"
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
        "name": "T6D",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(T6D)$"
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
        "name": "ViSUM",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(ViSUM)$"
        }
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 3
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 4
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
      "german-anime": 250
    },
    "specifications": [
      {
        "name": "3cTWeB",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(3cTWeB)$"
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
        "name": "BTW",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(BTW)$"
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
        "name": "Chotab",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(Chotab)$"
        }
      },
      {
        "name": "Cinefeel",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(Cinefeel)$"
        }
      },
      {
        "name": "CiT",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(CiT)$"
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
        "name": "Coo7",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(Coo7)$"
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
        "name": "DEEP",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(DEEP)$"
        }
      },
      {
        "name": "END",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(END)$"
        }
      },
      {
        "name": "ETHiCS",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(ETHiCS)$"
        }
      },
      {
        "name": "FC",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(FC)$"
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
        "name": "GNOME",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(GNOME)$"
        }
      },
      {
        "name": "iJP",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(iJP)$"
        }
      },
      {
        "name": "iKA",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(iKA)$"
        }
      },
      {
        "name": "iT00NZ",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(iT00NZ)$"
        }
      },
      {
        "name": "JETIX",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(JETIX)$"
        }
      },
      {
        "name": "KHN",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(KHN)$"
        }
      },
      {
        "name": "KiMCHI",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(KiMCHI)$"
        }
      },
      {
        "name": "LAZY",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(LAZY)$"
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
        "name": "MZABI",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(MZABI)$"
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
        "name": "NYH",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(NYH)$"
        }
      },
      {
        "name": "orbitron",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(orbitron)$"
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
        "name": "PSiG",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(PSiG)$"
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
        "name": "RTFM",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(RTFM)$"
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
        "name": "SbR",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(SbR)$"
        }
      },
      {
        "name": "SDCC",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(SDCC)$"
        }
      },
      {
        "name": "SIGMA",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(SIGMA)$"
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
        "name": "SPiRiT",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(SPiRiT)$"
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
        "name": "TVSmash",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(TVSmash)$"
        }
      },
      {
        "name": "WELP",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(WELP)$"
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
      },
      {
        "name": "WEBDL",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 3
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 4
        }
      }
    ]
  },
  "web-tier-03": {
    "name": "WEB Tier 03",
    "includeCustomFormatWhenRenaming": false,
    "trash_scores": {
      "default": 1600,
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
          "value": 3
        }
      },
      {
        "name": "WEBRIP",
        "implementation": "SourceSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": 4
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
        "name": "DRACULA",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(DRACULA)$"
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
      },
      {
        "name": "T4H",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(T4H)$"
        }
      },
      {
        "name": "ViSiON",
        "implementation": "ReleaseGroupSpecification",
        "negate": false,
        "required": false,
        "fields": {
          "value": "^(ViSiON)$"
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
