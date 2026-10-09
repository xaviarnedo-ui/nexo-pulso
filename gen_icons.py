#!/usr/bin/env python3
"""Iconos PWA de NEXO Pulso (icons/): línea de pulso blanca sobre el verde azulado de NEXO. python3 gen_icons.py"""
from PIL import Image, ImageDraw

ACENTO, BLANCO = (30, 95, 88), (255, 255, 255)
PUNTOS = [(0.18, 0.55), (0.36, 0.55), (0.44, 0.34), (0.54, 0.72), (0.62, 0.48), (0.82, 0.48)]


def icono(lado, escala=1.0, modo="RGB"):
    im = Image.new("RGB", (lado * 4, lado * 4), ACENTO)                 # 4× y reducir: bordes suaves
    d, s = ImageDraw.Draw(im), lado * 4
    c = (1 - escala) / 2
    pts = [((c + x * escala) * s, (c + y * escala) * s) for x, y in PUNTOS]
    d.line(pts, fill=BLANCO, width=int(s * 0.07 * escala), joint="curve")
    r = int(s * 0.035 * escala)
    for x, y in (pts[0], pts[-1]):
        d.ellipse([x - r, y - r, x + r, y + r], fill=BLANCO)
    return im.resize((lado, lado), Image.LANCZOS).convert(modo)


icono(192).save("icons/icon-192.png")
icono(512).save("icons/icon-512.png")
icono(512, 0.72).save("icons/icon-maskable-512.png")
icono(180).save("icons/apple-touch-icon.png")
print("iconos generados en icons/")
