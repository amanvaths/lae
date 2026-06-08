#!/usr/bin/env python3
"""Generate the LAE Protocol whitepaper as a branded multi-page PDF."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
    NextPageTemplate, PageBreak, Table, TableStyle, ListFlowable, ListItem,
)
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "lae-whitepaper.pdf")

INK = colors.HexColor("#05060a")
INK2 = colors.HexColor("#0c0f1a")
BRAND = colors.HexColor("#1e9bff")
BRAND_D = colors.HexColor("#0850b6")
ACCENT = colors.HexColor("#8b5cf6")
GOLD = colors.HexColor("#f5c33b")
TEXT = colors.HexColor("#1f2733")
MUTED = colors.HexColor("#5b6676")
LINE = colors.HexColor("#e4e8ee")

PAGE_W, PAGE_H = A4

# ---------- styles ----------
h1 = ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=20, textColor=BRAND_D,
                    spaceBefore=10, spaceAfter=8, leading=24)
h2 = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=13, textColor=colors.HexColor("#0b2a4a"),
                    spaceBefore=12, spaceAfter=5, leading=16)
body = ParagraphStyle("body", fontName="Helvetica", fontSize=10.2, textColor=TEXT,
                      leading=16, alignment=TA_JUSTIFY, spaceAfter=7)
bullet = ParagraphStyle("bullet", parent=body, spaceAfter=3)
small = ParagraphStyle("small", fontName="Helvetica", fontSize=8.2, textColor=MUTED, leading=11)
eyebrow = ParagraphStyle("eyebrow", fontName="Helvetica-Bold", fontSize=9, textColor=BRAND,
                         spaceAfter=2, leading=12)


def hexagon(c, cx, cy, r, fill, stroke=None):
    import math
    pts = []
    for i in range(6):
        a = math.pi / 6 + i * math.pi / 3
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    p = c.beginPath()
    p.moveTo(*pts[0])
    for pt in pts[1:]:
        p.lineTo(*pt)
    p.close()
    c.setFillColor(fill)
    if stroke:
        c.setStrokeColor(stroke); c.setLineWidth(2)
    c.drawPath(p, fill=1, stroke=1 if stroke else 0)


def cover(c, doc):
    c.saveState()
    c.setFillColor(INK); c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # glow blobs
    for (x, y, rad, col, alpha) in [
        (PAGE_W*0.5, PAGE_H*0.78, 240, BRAND, 0.18),
        (PAGE_W*0.85, PAGE_H*0.4, 180, ACCENT, 0.14),
        (PAGE_W*0.15, PAGE_H*0.25, 160, BRAND_D, 0.12),
    ]:
        c.saveState(); c.setFillAlpha(alpha); c.setFillColor(col)
        c.circle(x, y, rad, fill=1, stroke=0); c.restoreState()
    # subtle grid
    c.setStrokeColor(colors.HexColor("#13202f")); c.setLineWidth(0.5)
    step = 26
    for gx in range(0, int(PAGE_W), step):
        c.line(gx, 0, gx, PAGE_H)
    for gy in range(0, int(PAGE_H), step):
        c.line(0, gy, PAGE_W, gy)

    # logo
    cx, cy = PAGE_W/2, PAGE_H*0.72
    hexagon(c, cx, cy, 30, BRAND)
    c.setFillColor(colors.white); c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(cx, cy-6, "LAE")

    c.setFillColor(colors.white); c.setFont("Helvetica-Bold", 40)
    c.drawCentredString(cx, PAGE_H*0.56, "LAE Protocol")
    c.setFillColor(BRAND); c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(cx, PAGE_H*0.56-30, "The Decentralized Network Token")

    c.setFillColor(colors.HexColor("#9fb2c8")); c.setFont("Helvetica", 12)
    c.drawCentredString(cx, PAGE_H*0.44, "Turning the power of networking into a")
    c.drawCentredString(cx, PAGE_H*0.44-18, "transparent, on-chain rewards economy.")

    c.setStrokeColor(BRAND); c.setLineWidth(1)
    c.line(cx-60, PAGE_H*0.36, cx+60, PAGE_H*0.36)

    c.setFillColor(colors.HexColor("#6b7a8d")); c.setFont("Helvetica", 10)
    c.drawCentredString(cx, PAGE_H*0.30, "Whitepaper · Version 1.0 · June 2026")
    c.setFont("Helvetica", 8)
    c.drawCentredString(cx, PAGE_H*0.07, "This document is for informational purposes only and is not financial advice. $LAE is a utility token.")
    c.restoreState()


def content_bg(c, doc):
    c.saveState()
    c.setFillColor(colors.white); c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # header band
    c.setFillColor(INK); c.rect(0, PAGE_H-18*mm, PAGE_W, 18*mm, fill=1, stroke=0)
    hexagon(c, 20*mm, PAGE_H-9*mm, 5, BRAND)
    c.setFillColor(colors.white); c.setFont("Helvetica-Bold", 9)
    c.drawString(26*mm, PAGE_H-11*mm, "LAE Protocol")
    c.setFillColor(colors.HexColor("#9fb2c8")); c.setFont("Helvetica", 8)
    c.drawRightString(PAGE_W-18*mm, PAGE_H-11*mm, "Whitepaper v1.0")
    # footer
    c.setStrokeColor(LINE); c.setLineWidth(0.6)
    c.line(18*mm, 14*mm, PAGE_W-18*mm, 14*mm)
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    c.drawString(18*mm, 9*mm, "lae.io")
    c.drawRightString(PAGE_W-18*mm, 9*mm, "Page %d" % doc.page)
    c.drawCentredString(PAGE_W/2, 9*mm, "Not financial advice")
    c.restoreState()


def kv_table(rows, col0=70*mm):
    t = Table(rows, colWidths=[col0, PAGE_W-36*mm-col0])
    t.setStyle(TableStyle([
        ("FONT", (0,0), (-1,-1), "Helvetica", 9.5),
        ("FONT", (0,0), (0,-1), "Helvetica-Bold", 9.5),
        ("TEXTCOLOR", (0,0), (0,-1), colors.HexColor("#0b2a4a")),
        ("TEXTCOLOR", (1,0), (1,-1), TEXT),
        ("LINEBELOW", (0,0), (-1,-2), 0.5, LINE),
        ("TOPPADDING", (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ]))
    return t


def alloc_table(rows):
    data = [["Allocation", "%", "Purpose"]] + rows
    t = Table(data, colWidths=[42*mm, 18*mm, PAGE_W-36*mm-60*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), INK),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("FONT", (0,0), (-1,0), "Helvetica-Bold", 9.5),
        ("FONT", (0,1), (-1,-1), "Helvetica", 9.5),
        ("TEXTCOLOR", (0,1), (-1,-1), TEXT),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#f4f7fb")]),
        ("LINEBELOW", (0,0), (-1,-1), 0.4, LINE),
        ("TOPPADDING", (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING", (0,0), (-1,-1), 8),
        ("ALIGN", (1,0), (1,-1), "CENTER"),
    ]))
    return t


def bullets(items):
    return ListFlowable(
        [ListItem(Paragraph(t, bullet), leftIndent=6, value="•") for t in items],
        bulletType="bullet", bulletColor=BRAND, leftIndent=14, bulletFontSize=9,
    )


def build():
    doc = BaseDocTemplate(
        OUT, pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm, topMargin=24*mm, bottomMargin=18*mm,
        title="LAE Protocol Whitepaper", author="LAE Protocol",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[frame], onPage=cover),
        PageTemplate(id="content", frames=[frame], onPage=content_bg),
    ])

    S = []
    A = S.append

    # cover handled by template; jump to content
    A(NextPageTemplate("content"))
    A(PageBreak())

    A(Paragraph("ABSTRACT", eyebrow))
    A(Paragraph("LAE Protocol", h1))
    A(Paragraph(
        "LAE is a Web3 protocol that reimagines network-based growth as a transparent, "
        "on-chain rewards economy. Traditional networking and referral programs hide their "
        "ledgers, delay payouts and concentrate value with intermediaries. LAE replaces that "
        "opaque back-office with smart contracts: every referral, rank and reward is a "
        "verifiable transaction, settled instantly to self-custodied wallets. This paper "
        "describes the $LAE token, its fixed and deflationary supply, the multi-level on-chain "
        "reward engine, the technical architecture, security posture, governance path and "
        "associated risks.", body))

    A(Paragraph("1. Introduction", h2))
    A(Paragraph(
        "Networks create value. Yet the people who build them rarely own a fair, transparent "
        "share of the value they generate. Legacy network and affiliate models route rewards "
        "through centralized systems that members cannot audit, often with high fees and long "
        "settlement windows. LAE applies the guarantees of public blockchains — transparency, "
        "immutability and self-custody — to the act of building a network.", body))

    A(Paragraph("2. The Problem", h2))
    A(bullets([
        "<b>Opaque ledgers:</b> members cannot independently verify how rewards are calculated or whether they were paid.",
        "<b>Delayed settlement:</b> payouts can take weeks and are subject to discretionary holds.",
        "<b>Custodial risk:</b> balances sit with operators, exposing members to insolvency and freezes.",
        "<b>Value leakage:</b> intermediaries capture a disproportionate share of network value.",
    ]))

    A(Paragraph("3. The LAE Solution", h2))
    A(Paragraph(
        "LAE encodes the entire reward economy in audited smart contracts. When a member in "
        "your network transacts, the protocol automatically routes a share up the referral tree "
        "across multiple levels, settling in $LAE to each participant's wallet in the same "
        "transaction. There is no back-office, no manual approval and no custodian.", body))
    A(bullets([
        "<b>Network-to-earn:</b> earn on the activity of your direct and indirect network, up to seven levels deep.",
        "<b>Instant, on-chain settlement:</b> rewards arrive the moment they are earned.",
        "<b>Self-custody first:</b> connect any Web3 wallet; you always hold your keys and tokens.",
        "<b>Deflationary:</b> a portion of every transaction is burned, tightening supply as the network grows.",
    ]))

    A(Paragraph("4. Token Overview", h2))
    A(kv_table([
        ["Token name", "LAE"],
        ["Ticker", "$LAE"],
        ["Max supply", "1,000,000,000 (fixed — no minting)"],
        ["Standard", "ERC-20 (multi-chain via canonical bridge)"],
        ["Networks", "Ethereum, BNB Chain, Polygon, Arbitrum"],
        ["Transaction burn", "1.5%"],
        ["Team vesting", "36 months, linear"],
    ]))

    A(Paragraph("5. Tokenomics", h2))
    A(Paragraph(
        "Supply is fixed at one billion $LAE and can never be inflated. The largest allocation "
        "flows directly back to the network participants who grow the protocol.", body))
    A(alloc_table([
        ["Network rewards", "40%", "Routed to members via the on-chain reward engine"],
        ["Staking & liquidity", "22%", "Staking emissions and DEX/CEX liquidity"],
        ["Treasury", "15%", "Protocol-owned reserves, governed on-chain"],
        ["Team (vested)", "12%", "36-month linear vesting, contributor alignment"],
        ["Ecosystem fund", "8%", "Grants, integrations, partnerships"],
        ["Public sale", "3%", "Initial distribution and price discovery"],
    ]))

    A(Paragraph("6. The Network Reward Model", h2))
    A(Paragraph(
        "Rewards propagate up a member's referral tree. Each level earns a defined percentage of "
        "qualifying downline activity, with a depth bonus that extends up to seven levels. All "
        "rates are enforced by the smart contract and are publicly verifiable.", body))
    A(alloc_table([
        ["Level 1 — Direct", "12%", "Members you onboard directly"],
        ["Level 2", "8%", "Your network's network"],
        ["Level 3", "5%", "Third-degree connections"],
        ["Level 4–7", "3%", "Depth bonus across deeper levels"],
    ]))

    A(Paragraph("7. Technical Architecture", h2))
    A(bullets([
        "<b>Reward engine:</b> a gas-optimized contract that computes and distributes multi-level rewards atomically within the triggering transaction.",
        "<b>Registry:</b> an on-chain graph of referral relationships, sybil-resistant and append-only.",
        "<b>Staking vaults:</b> non-custodial vaults that issue rank-based APY and unlock higher reward tiers.",
        "<b>Bridge:</b> a canonical lock-and-mint bridge keeps a unified supply across supported chains.",
        "<b>Oracles:</b> Chainlink price feeds for accurate, manipulation-resistant valuations.",
    ]))

    A(Paragraph("8. Security", h2))
    A(Paragraph(
        "Contracts are independently audited and the reports are public. Team tokens are locked "
        "in a vesting contract. The protocol follows defense-in-depth practices: least-privilege "
        "access, timelocked admin actions, circuit breakers for anomalous activity and an ongoing "
        "bug-bounty program. Users remain non-custodial at all times.", body))

    A(Paragraph("9. Roadmap", h2))
    A(kv_table([
        ["Q1 2025 — Genesis", "Audit, token generation event, founding network"],
        ["Q2 2025 — Network launch", "On-chain referral engine, multi-level routing, wallets"],
        ["Q3 2025 — Scale", "Staking vaults, mobile dApp, cross-chain bridge"],
        ["Q4 2025 — Decentralize", "LAE DAO governance, treasury votes, rank NFTs"],
        ["2026 — Ecosystem", "Merchant payments, real-world utility, ambassadors"],
    ], col0=52*mm))

    A(Paragraph("10. Governance", h2))
    A(Paragraph(
        "LAE progressively decentralizes into a DAO. $LAE holders propose and vote on protocol "
        "parameters, treasury allocation and upgrades. Voting is conducted on-chain with "
        "transparent, auditable outcomes, transferring control of the protocol to its community.", body))

    A(Paragraph("11. Risk Factors", h2))
    A(bullets([
        "Crypto assets are volatile and may lose all value.",
        "Smart contracts may contain undiscovered vulnerabilities despite audits.",
        "Regulatory treatment of digital assets varies by jurisdiction and may change.",
        "Reward rates and projections are targets, not guarantees, and depend on network activity.",
    ]))

    A(Paragraph("12. Conclusion", h2))
    A(Paragraph(
        "LAE brings the transparency and ownership of Web3 to network building. By settling every "
        "reward on-chain and keeping members in full custody of their assets, LAE aligns incentives "
        "around real, verifiable growth — turning your network into an asset you truly own.", body))

    A(Spacer(1, 8))
    A(Paragraph(
        "<b>Disclaimer.</b> This whitepaper is for informational purposes only and does not "
        "constitute financial, investment, legal or tax advice, nor an offer or solicitation to "
        "buy any security. $LAE is a utility token. Always do your own research.", small))

    doc.build(S)
    print("Wrote", os.path.abspath(OUT))


if __name__ == "__main__":
    build()
