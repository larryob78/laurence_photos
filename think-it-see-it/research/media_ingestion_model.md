# Media Ingestion Model

> How THINK IT. SEE IT. should handle media assets across the entire lifecycle.

---

## 1. SUPPORTED MEDIA TYPES

| Type | Formats | Max Size (MVP) | Use Cases |
|------|---------|----------------|-----------|
| **Image** | JPEG, PNG, WebP, AVIF | 10MB | Scene backgrounds, hero visuals, evidence, mockups |
| **SVG** | SVG | 2MB | Icons, logos, diagrams, brand marks |
| **GIF** | GIF | 5MB | Animated elements, micro-interactions, social mockups |
| **Video** | MP4 (H.264), WebM | 50MB | Scene backgrounds, campaign film, social content |
| **Document** | PDF | 20MB | Brand guidelines, research docs, brief documents |
| **Font** | WOFF2, OTF, TTF | 5MB | Brand typography |

---

## 2. INGESTION PIPELINES

### 2.1 Direct Upload

```
User selects file(s)
  → Client-side validation (type, size, dimensions)
  → Compression/optimization (client-side for images)
  → Upload to object storage (S3/R2/Vercel Blob)
  → Server-side processing:
      → Generate thumbnail (320px wide)
      → Extract metadata (EXIF, dimensions, duration)
      → Generate blurhash placeholder
      → Store Asset record in database
  → Return Asset ID to client
```

**Image optimization pipeline:**
- JPEG/PNG → WebP conversion for display
- Original preserved for export
- Thumbnails: 320px, 640px, 1280px widths
- Blurhash: 4x3 components for instant placeholder

**Video processing:**
- Extract poster frame (first frame or 1s mark)
- Generate thumbnail
- Detect duration
- No transcoding at MVP — require H.264 MP4

### 2.2 URL Import

```
User pastes URL
  → Validate URL format and accessibility
  → Fetch resource headers (Content-Type, Content-Length)
  → If image/video: download, validate, process as upload
  → If webpage: extract Open Graph image as fallback
  → Store with source URL for attribution
```

### 2.3 Brand Kit Extraction

```
User uploads brand guideline PDF
  → Extract embedded images (logos, colour swatches)
  → OCR/parse text for colour values (hex, RGB, Pantone)
  → Extract font names from text
  → Attempt to match fonts to known font libraries
  → Generate draft BrandKit object for user review
  → User confirms/edits extracted values
```

This is a **semi-automated** process. The system extracts what it can and surfaces it for human review. Never auto-apply unconfirmed brand values.

### 2.4 AI-Generated Media

```
User provides text prompt (or system generates from scene context)
  → Call image generation API (DALL-E, Stable Diffusion, Midjourney API)
  → Receive generated image
  → Store with:
      - source: "ai-generated"
      - generationPrompt: the prompt used
      - rights: { license: "ai-generated", commercialUse: true/flag }
  → User can regenerate, edit prompt, or discard
```

**Important:** AI-generated media should always be flagged with its generation prompt and source model for rights transparency.

### 2.5 Stock Library Integration

```
User searches stock library (Unsplash, Pexels)
  → API search with query
  → Display results with attribution info
  → User selects image
  → Download full-resolution version
  → Store with proper attribution and license metadata
  → Display attribution in exported decks where required
```

---

## 3. ASSET METADATA MODEL

Every ingested asset should carry:

```json
{
  "id": "asset_001",
  "type": "image",
  "fileName": "hero-visual.jpg",
  "mimeType": "image/jpeg",
  "fileSize": 2340000,
  "width": 3840,
  "height": 2160,
  "aspectRatio": "16:9",
  "urls": {
    "original": "https://storage.example.com/original/hero-visual.jpg",
    "display": "https://storage.example.com/optimized/hero-visual.webp",
    "thumbnail": "https://storage.example.com/thumb/hero-visual.webp"
  },
  "blurhash": "LEHV6nWB2yk8pyoJadR*.7kCMdnj",
  "source": "upload",
  "rights": {
    "license": "client-owned",
    "attribution": null,
    "commercialUse": true,
    "expiresAt": null,
    "aiTrainable": false
  },
  "tags": ["hero", "campaign", "outdoor", "lifestyle"],
  "altText": "Young woman running through urban landscape at dawn",
  "usedInScenes": ["scene_003", "scene_007"],
  "version": 1,
  "parentAssetId": null,
  "uploadedAt": "2025-03-15T10:30:00Z",
  "uploadedBy": "user_abc"
}
```

---

## 4. RIGHTS METADATA

Every asset MUST carry rights metadata. This is non-negotiable for a professional tool.

| Source | Default License | Commercial Use | Requires Attribution | AI Trainable |
|--------|---------------|---------------|---------------------|-------------|
| Client upload | Client-owned | Yes | No | No — assume no |
| Agency upload | Agency-owned | Yes | No | Internal only |
| Unsplash | Unsplash License | Yes | Appreciated, not required | Check current terms |
| Pexels | Pexels License | Yes | Not required | Check current terms |
| AI-generated | AI-generated | Flag for review | N/A | Flag for review |
| URL import | Unknown | Flag for review | Unknown | No — assume no |
| Brand kit | Client-owned | Project use | No | No |

**Rule:** When in doubt, flag the asset and restrict to reference-only until the user confirms rights.

---

## 5. ASSET TAGGING

### Automatic Tags (system-generated)
- **From metadata:** dimensions, aspect ratio, file type, colour palette extraction
- **From context:** which scene it was added to, which deck it belongs to
- **From AI analysis:** subject detection, mood/tone classification, dominant colours

### Manual Tags (user-provided)
- Free-text tags
- Brand association
- Campaign association
- Scene type suitability

### Tag Categories
| Category | Examples | Use |
|----------|----------|-----|
| Subject | people, landscape, product, abstract | Search and filtering |
| Mood | energetic, calm, provocative, warm | Scene matching |
| Colour | warm-tones, monochrome, vibrant, muted | Brand consistency |
| Usage | hero, background, icon, evidence, mockup | Layout placement |
| Campaign | summer-2025, brand-relaunch, product-launch | Project organization |

---

## 6. ASSET VERSIONING

When a user edits an asset (crop, filter, replace), the system should:

1. Preserve the original as `version 1`
2. Create a new Asset record with `version: 2` and `parentAssetId: original.id`
3. Update scene references to point to the new version
4. Allow rollback to any previous version

**Never mutate the original file.** Always create new versions.

---

## 7. MVP SCOPE

For MVP, implement:
- [x] Direct image upload (JPEG, PNG, WebP)
- [x] Client-side image optimization
- [x] Thumbnail generation
- [x] Basic metadata extraction
- [x] Rights metadata capture (manual)
- [x] Asset tagging (manual)
- [ ] SVG upload for logos
- [ ] URL import
- [ ] Stock library search (Unsplash API)
- [ ] AI image generation integration
- [ ] Video upload
- [ ] Brand kit PDF extraction
- [ ] Automatic tagging via AI

**Post-MVP:**
- Video processing pipeline
- AI-powered brand kit extraction
- Automatic subject/mood tagging
- Asset search across projects
- Usage analytics (which assets get used most)
- Rights expiry alerts
- Batch upload and processing

---

## 8. STORAGE ARCHITECTURE (MVP)

For MVP, use Vercel Blob or similar simple object storage:

```
/assets/
  /originals/     → Original uploaded files
  /optimized/     → WebP/compressed versions for display
  /thumbnails/    → 320px thumbnails
  /exports/       → Generated deck exports (PDF, PPTX)
```

**Naming convention:** `{assetId}_{version}.{ext}`

**CDN:** Serve optimized and thumbnail versions through CDN. Originals only for export processing.

---

*Document version: 1.0*
