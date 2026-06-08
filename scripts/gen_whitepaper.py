#!/usr/bin/env python3
"""Generate the LAE Protocol whitepaper as a branded, multi-page PDF.

Output: public/lae-whitepaper.pdf
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, NextPageTemplate,
    PageBreak, Table, TableStyle, ListFlowable, ListItem,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

# ---- Brand palette -------------------------------------------------------
INK = colors.HexColor("#05060a")
INK2 = colors.HexColor("#0c0f1a")
BRAND = colors.HexColor("#1e9bff")
BRAND_D = colors.HexColor("#0062e1")
ACCENT = colors.HexColor("#8b5cf6")
GOLD = colors.HexColor("#f5c33b")
SLATE = colors.HexColor("#334155")
MUTE = colors.HexColor("#64748b")
LINE = colors.HexColor("#e2e8f0")

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "public", "lae-whitepaper.pdf")
os.makedirs(os.path.dirname(OUT), exist_ok=True)

PAGE_W, PAGE_H = A4
MARGIN = 22 * mm

# ---- Styles --------------------------------------------------------------
ss = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=ss["Heading1"], fontName="Helvetica-Bold",
                    fontSize=20, textColor=INK, spaceBefore=6, spaceAfter=10, leading=24)
H2 = ParagraphStyle("H2", parent=ss["Heading2"], fontName="Helvetica-Bold",
                    fontSize=13.5, textColor=BRAND_D, spaceBefore=14, spaceAfter=6, leading=17)
BODY = ParagraphStyle("Body", parent=ss["BodyText"], fontName="Helvetica",
                      fontSize=10.2, textColor=SLATE, leading=15.5, alignment=TA_JUSTIFY,
                      spaceAfter=7)
BULLET = ParagraphStyle("Bullet", parent=BODY, leftIndent=4, spaceAfter=3)
SMALL = ParagraphStyle("Small", parent=BODY, fontSize=8.6, textColor=MUTE, leading=12,
                       alignment=TA_CENTER)
EYEBROW = ParagraphStyle("Eyebrow", fontName="Helvetica-Bold", fontSize=8.5,
                         textColor=BRAND, leading=12, spaceAfter=2)

# Cover styles (light text on dark)
COVER_TITLE = ParagraphStyle("CoverTitle", fontName="Helvetica-Bold", fontSize=46,
                             textColor=colors.white, leading=50, alignment=TA_CENTER)
COVER_SUB = ParagraphStyle("CoverSub", fontName="Helvetica", fontSize=14,
                           textColor=colors.HexColor("#9fc7ff"), leading=20, alignment=TA_CENTER)
COVER_TAG = ParagraphStyle("CoverTag", fontName="Helvetica", fontSize=10,
                           textColor=colors.HexColor("#94a3b8"), leading=15, alignment=TA_CENTER)


def cover_bg(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(INK)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # glow bands
    for i, (c, a) in enumerate([(BRAND, 0.16), (ACCENT, 0.12)]):
        canvas.setFillColor(c)
        canvas.setFillAlpha(a)
        cy = PAGE_H - 70 * mm - i * 30 * mm
        canvas.ellipse(PAGE_W/2 - 90*mm, cy - 40*mm, PAGE_W/2 + 90*mm, cy + 40*mm, fill=1, stroke=0)
    canvas.setFillAlpha(1)
    # hexagon mark
    cx, cy, r = PAGE_W/2, PAGE_H - 52*mm, 13*mm
    import math
    pts = [(cx + r*math.cos(math.radians(60*k-90)), cy + r*math.sin(math.radians(60*k-90))) for k in range(6)]
    p = canvas.beginPath()
    p.moveTo(*pts[0])
    for pt in pts[1:]:
        p.lineTo(*pt)
    p.close()
    canvas.setFillColor(BRAND)
    canvas.drawPath(p, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 15)
    canvas.drawCentredString(cx, cy - 5, "LAE")
    # footer rule
    canvas.setStrokeColor(colors.HexColor("#1e2a44"))
    canvas.line(MARGIN, 30*mm, PAGE_W-MARGIN, 30*mm)
    canvas.setFillColor(colors.HexColor("#64748b"))
    canvas.setFont("Helvetica", 9)
    canvas.drawString(MARGIN, 23*mm, "LAE Protocol  ·  Whitepaper v1.0")
    canvas.drawRightString(PAGE_W-MARGIN, 23*mm, "lae.finance")
    canvas.restoreState()


def content_bg(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(colors.white)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # header
    canvas.setFillColor(BRAND)
    canvas.rect(0, PAGE_H-10*mm, PAGE_W, 10*mm, fill=1, stroke=0)
    canvas.setFillColor(INK)
    canvas.setFont("Helvetica-Bold", 8.5)
    canvas.drawString(MARGIN, PAGE_H-7*mm, "LAE PROTOCOL")
    canvas.setFillColor(colors.white)
    canvas.drawRightString(PAGE_W-MARGIN, PAGE_H-7*mm, "WHITEPAPER v1.0")
    # footer
    canvas.setStrokeColor(LINE)
    canvas.line(MARGIN, 15*mm, PAGE_W-MARGIN, 15*mm)
    canvas.setFillColor(MUTE)
    canvas.setFont("Helvetica", 8.5)
    canvas.drawString(MARGIN, 10*mm, "© 2026 LAE Protocol — Not financial advice.")
    canvas.drawRightString(PAGE_W-MARGIN, 10*mm, "Page %d" % doc.page)
    canvas.restoreState()


def chip_table(rows):
    t = Table(rows, colWidths=[55*mm, (PAGE_W-2*MARGIN-55*mm)])
    t.setStyle(TableStyle([
        ("FONT", (0, 0), (0, -1), "Helvetica-Bold", 9.5),
        ("FONT", (1, 0), (1, -1), "Helvetica", 9.5),
        ("TEXTCOLOR", (0, 0), (0, -1), INK),
        ("TEXTCOLOR", (1, 0), (1, -1), SLATE),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, LINE),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return t


def bullets(items):
    return ListFlowable(
        [ListItem(Paragraph(x, BULLET), leftIndent=10, value="•") for x in items],
        bulletType="bullet", bulletColor=BRAND, bulletFontSize=9, leftIndent=10,
    )


def build():
    doc = BaseDocTemplate(OUT, pagesize=A4,
                          leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=18*mm, bottomMargin=20*mm,
                          title="LAE Protocol Whitepaper", author="LAE Protocol")
    frame = Frame(MARGIN, 18*mm, PAGE_W-2*MARGIN, PAGE_H-38*mm, id="body")
    cover_frame = Frame(MARGIN, 35*mm, PAGE_W-2*MARGIN, PAGE_H-120*mm, id="cover")
    doc.addPageTemplates([
        PageTemplate(id="Cover", frames=[cover_frame], onPage=cover_bg),
        PageTemplate(id="Content", frames=[frame], onPage=content_bg),
    ])

    s = []
    # ---- COVER ----
    s += [Spacer(1, 8*mm),
          Paragraph("THE DECENTRALIZED NETWORK TOKEN", COVER_TAG),
          Spacer(1, 6*mm),
          Paragraph("LAE Protocol", COVER_TITLE),
          Spacer(1, 5*mm),
          Paragraph("Turning the power of networking into a transparent, "
                    "on-chain rewards economy.", COVER_SUB),
          Spacer(1, 10*mm),
          Paragraph("Whitepaper v1.0  ·  June 2026", COVER_TAG)]
    s += [NextPageTemplate("Content"), PageBreak()]

    # ---- 1. Abstract ----
    s += [Paragraph("Abstract", H1),
          Paragraph("LAE is a Web3 protocol that reimagines network-based growth "
                    "as a fully on-chain, verifiable rewards economy. Traditional "
                    "network plans hide their ledgers, gate payouts behind opaque "
                    "back-offices, and ask participants to trust a central operator. "
                    "LAE removes that trust assumption entirely: referral structure, "
                    "rank, and reward distribution are encoded in audited smart "
                    "contracts, settled instantly, and owned by the participant via "
                    "self-custody. This document describes the LAE token, its "
                    "multi-level reward engine, supply design, and rollout.", BODY)]

    s += [Paragraph("1. The Problem", H2),
          Paragraph("Networking and referral-driven businesses move enormous value, "
                    "yet the people who build the networks rarely own the rails. "
                    "Common failures include:", BODY),
          bullets([
              "<b>Opaque ledgers.</b> Participants cannot independently verify how "
              "rewards are calculated or whether they were paid in full.",
              "<b>Delayed settlement.</b> Earnings are held for weeks behind "
              "withdrawal thresholds and manual approvals.",
              "<b>Custodial risk.</b> A single operator controls the balances, the "
              "rules, and the exit.",
              "<b>No portability.</b> The network you build is locked inside one "
              "company's database.",
          ])]

    s += [Paragraph("2. The LAE Solution", H2),
          Paragraph("LAE encodes the entire reward economy on a public blockchain. "
                    "Every connection, rank change, and payout is a transaction that "
                    "anyone can audit. Rewards settle the instant they are earned, "
                    "directly to the participant's wallet — no claims, no waiting, "
                    "no intermediary.", BODY),
          bullets([
              "<b>Network-to-earn.</b> Earn $LAE automatically on every level of "
              "the network you grow.",
              "<b>On-chain &amp; transparent.</b> All rewards and ranks are "
              "verifiable transactions.",
              "<b>Instant settlement.</b> Value lands in your wallet the moment it "
              "is earned.",
              "<b>Self-custody first.</b> Your keys, your tokens, your network.",
          ])]

    s += [PageBreak()]
    # ---- Network plan ----
    s += [Paragraph("3. The Network Reward Engine", H1),
          Paragraph("When any member of your network transacts, the smart contract "
                    "routes a share of the protocol fee upward through your tree, "
                    "across up to seven levels. Rates decay with depth to keep the "
                    "system sustainable while still rewarding deep, active networks.", BODY),
          Spacer(1, 3*mm),
          chip_table([
              ["Level", "Reward share"],
              ["Level 1 — Direct referrals", "12%"],
              ["Level 2", "8%"],
              ["Level 3", "5%"],
              ["Levels 4–7 (depth bonus)", "3%"],
          ]),
          Spacer(1, 4*mm),
          Paragraph("All routing is deterministic and executed by the contract; "
                    "there is no manual reconciliation and no operator discretion.", BODY)]

    s += [Paragraph("4. Tokenomics", H2),
          Paragraph("$LAE has a fixed maximum supply of 1,000,000,000 tokens. No "
                    "function exists to mint beyond this cap. A 1.5% burn on each "
                    "transaction makes the asset deflationary as network activity "
                    "grows. The largest allocation flows back to the network.", BODY),
          Spacer(1, 3*mm),
          chip_table([
              ["Allocation", "Share"],
              ["Network rewards", "40%"],
              ["Staking &amp; liquidity", "22%"],
              ["Treasury", "15%"],
              ["Team (36-month vesting)", "12%"],
              ["Ecosystem fund", "8%"],
              ["Public sale", "3%"],
          ])]

    s += [PageBreak()]
    s += [Paragraph("5. Staking &amp; Sustainability", H1),
          Paragraph("Holders can stake $LAE to unlock higher reward tiers and earn "
                    "a variable APY sourced from protocol fees and the staking "
                    "allocation. Staking aligns long-term incentives: the deeper a "
                    "participant's commitment, the greater their share of network "
                    "flow. Emissions are bounded by the fixed supply and tapered "
                    "over time.", BODY)]

    s += [Paragraph("6. Security", H2),
          bullets([
              "<b>Audited contracts.</b> Core contracts are reviewed by independent "
              "security firms; reports are published.",
              "<b>Vesting locks.</b> Team tokens are locked in a vesting contract "
              "over 36 months.",
              "<b>Oracle integrity.</b> Price-sensitive logic uses decentralized "
              "oracles to resist manipulation.",
              "<b>Non-custodial.</b> The protocol never takes custody of user funds.",
          ])]

    s += [Paragraph("7. Roadmap", H2),
          bullets([
              "<b>Q1 2025 — Genesis.</b> Audit, token generation event, founding network.",
              "<b>Q2 2025 — Network launch.</b> On-chain referral engine, reward routing.",
              "<b>Q3 2025 — Scale.</b> Staking vaults, mobile dApp, cross-chain bridges.",
              "<b>Q4 2025 — Decentralize.</b> LAE DAO governance and treasury votes.",
              "<b>2026 — Ecosystem.</b> Merchant payments and real-world utility.",
          ])]

    s += [PageBreak()]
    s += [Paragraph("8. Legal Disclaimer", H1),
          Paragraph("This whitepaper is for informational purposes only and does "
                    "not constitute financial, investment, legal, or tax advice, nor "
                    "an offer or solicitation to buy or sell any asset. $LAE is a "
                    "utility token intended for use within the LAE Protocol. Digital "
                    "assets are highly volatile and may lose all value. Forward-looking "
                    "statements are subject to change and are not guarantees of future "
                    "performance. Participation may be restricted in your jurisdiction; "
                    "it is your responsibility to ensure compliance with local laws. "
                    "Always conduct your own research and consult qualified "
                    "professionals before participating.", BODY),
          Spacer(1, 8*mm),
          Paragraph("© 2026 LAE Protocol. All rights reserved.  ·  lae.finance", SMALL)]

    doc.build(s)
    print("Wrote", os.path.normpath(OUT))


if __name__ == "__main__":
    build()
