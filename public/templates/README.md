# UC ERA - Zodiac Member Card Templates

This folder contains the zodiac sign templates for member card generation.

## Required Templates

Add 12 zodiac sign template images (PNG format):

1. **Aries.png** - March 21 - April 19
2. **Taurus.png** - April 20 - May 20
3. **Gemini.png** - May 21 - June 20
4. **Cancer.png** - June 21 - July 22
5. **Leo.png** - July 23 - August 22
6. **Virgo.png** - August 23 - September 22
7. **Libra.png** - September 23 - October 22
8. **Scorpio.png** - October 23 - November 21
9. **Sagittarius.png** - November 22 - December 21
10. **Capricorn.png** - December 22 - January 19
11. **Aquarius.png** - January 20 - February 18
12. **Pisces.png** - February 19 - March 20

## Template Specifications

- **Canvas Size**: 576 x 384 pixels
- **File Format**: PNG (with transparency support)
- **Quality**: High resolution (at least 300 DPI)

## Design Layout

### Photo Area
- **Position**: X: 39px, Y: 39px
- **Size**: Width: 203px, Height: 305px
- **Border Radius**: 15px
- **Note**: Leave this area empty/transparent for user photo overlay

### Name Text Area
- **Position**: X: 270px, Y: 295px
- **Width**: 284px
- **Font**: Bold 30px Arial
- **Color**: #000000 (Black)
- **Alignment**: Left
- **Note**: This area will display user's full name

### Member ID Text Area
- **Position**: X: 462px, Y: 355px
- **Width**: 70px
- **Font**: Normal 13px Arial
- **Color**: #000000 (Black)
- **Alignment**: Right
- **Note**: This area will display 7-digit member ID

## Template Design Guidelines

1. **Background**: Design your zodiac-themed background around the photo area
2. **Colors**: Use zodiac-appropriate colors (e.g., fire colors for Leo, water colors for Pisces)
3. **Elements**: Include zodiac symbol, constellation, or related imagery
4. **Text Areas**: Keep name and ID areas clear of background elements
5. **Photo Area**: Ensure photo area complements the overall design

## File Naming

- **Important**: File names are case-sensitive
- Use exact names: `Aries.png`, `Leo.png`, `Virgo.png`, etc.
- First letter must be capitalized

## Example Structure

```
public/templates/
├── README.md (this file)
├── Aries.png
├── Taurus.png
├── Gemini.png
├── Cancer.png
├── Leo.png
├── Virgo.png
├── Libra.png
├── Scorpio.png
├── Sagittarius.png
├── Capricorn.png
├── Aquarius.png
└── Pisces.png
```

## Testing

After adding templates:
1. Complete member card registration
2. System will automatically calculate zodiac from DOB
3. Correct template will be loaded
4. User photo, name, and ID will be overlaid
5. Professional member card will be generated!

---

**Note**: Without these templates, the member card generation will fall back to displaying the user's public photo only.




