export type LegalSection = { heading: string; body: string[] };
export type LegalDoc = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

export const privacy: LegalDoc = {
  title: "Privacy Policy",
  updated: "June 8, 2026",
  intro:
    "LAE Protocol (“LAE”, “we”, “us”) respects your privacy. This policy explains what information we collect when you use the LAE website, dashboard and related services (the “Services”), and how we use it.",
  sections: [
    {
      heading: "1. Information we collect",
      body: [
        "On-chain data: When you connect a wallet, we read your public wallet address and on-chain activity relevant to the protocol (balances, referral links, reward transactions). This data is public on the blockchain.",
        "Usage data: We collect anonymous analytics such as pages visited, device type and approximate region to improve the product.",
        "Voluntary data: If you create an account or contact support, we collect the email address and details you provide.",
      ],
    },
    {
      heading: "2. How we use information",
      body: [
        "To operate the Services, route network rewards, and display your dashboard.",
        "To secure the platform, prevent fraud and abuse, and comply with legal obligations.",
        "To communicate product updates if you opt in. You can unsubscribe at any time.",
      ],
    },
    {
      heading: "3. What we do not do",
      body: [
        "We never take custody of your funds or private keys. LAE is non-custodial.",
        "We do not sell your personal data to third parties.",
      ],
    },
    {
      heading: "4. Cookies",
      body: [
        "We use essential cookies for session management and optional analytics cookies. You can control cookies through your browser settings.",
      ],
    },
    {
      heading: "5. Data retention & your rights",
      body: [
        "We retain off-chain personal data only as long as necessary. On-chain data is immutable and outside our control.",
        "Subject to applicable law, you may request access, correction or deletion of your off-chain personal data by contacting privacy@lae.io.",
      ],
    },
    {
      heading: "6. Contact",
      body: ["Questions about this policy? Email privacy@lae.io."],
    },
  ],
};

export const terms: LegalDoc = {
  title: "Terms of Service",
  updated: "June 8, 2026",
  intro:
    "These Terms govern your access to and use of the LAE Protocol Services. By connecting a wallet or using the Services you agree to these Terms.",
  sections: [
    {
      heading: "1. Eligibility",
      body: [
        "You must be at least 18 years old and legally permitted to use digital assets in your jurisdiction. You are responsible for complying with your local laws.",
      ],
    },
    {
      heading: "2. The Services",
      body: [
        "LAE provides a non-custodial, on-chain rewards protocol and informational interfaces. Smart contracts execute autonomously; we do not control or reverse on-chain transactions.",
        "Network reward rates, tokenomics and features described on the site may change as the protocol evolves and through governance.",
      ],
    },
    {
      heading: "3. Your responsibilities",
      body: [
        "You are solely responsible for securing your wallet, private keys and seed phrase. Lost keys cannot be recovered by us.",
        "You agree not to use the Services for unlawful activity, market manipulation, or to circumvent sanctions and applicable regulations.",
      ],
    },
    {
      heading: "4. No financial advice",
      body: [
        "Nothing on the Services constitutes financial, investment, legal or tax advice. $LAE is a utility token, not a security or an investment contract offered by us.",
      ],
    },
    {
      heading: "5. Assumption of risk",
      body: [
        "Digital assets are volatile and may lose all value. Smart contracts may contain bugs despite audits. You use the Services at your own risk.",
      ],
    },
    {
      heading: "6. Limitation of liability",
      body: [
        "To the maximum extent permitted by law, LAE and its contributors are not liable for any indirect, incidental or consequential damages, or for losses arising from your use of the Services or the blockchain.",
      ],
    },
    {
      heading: "7. Changes",
      body: [
        "We may update these Terms. Continued use after changes constitutes acceptance. Material changes will be announced through official channels.",
      ],
    },
  ],
};

export const disclaimer: LegalDoc = {
  title: "Disclaimer",
  updated: "June 8, 2026",
  intro:
    "Please read this disclaimer carefully before using LAE Protocol or acquiring $LAE.",
  sections: [
    {
      heading: "1. Not financial advice",
      body: [
        "All information provided on this website is for general informational purposes only and does not constitute financial, investment, legal, or tax advice. Always do your own research and consult a qualified professional.",
      ],
    },
    {
      heading: "2. Market risk",
      body: [
        "Crypto assets including $LAE are highly volatile and speculative. Prices can go to zero. Never contribute more than you can afford to lose.",
      ],
    },
    {
      heading: "3. No guarantees",
      body: [
        "Reward rates, APYs and projections shown are illustrative targets, not guarantees. Actual results depend on network activity, market conditions and protocol governance.",
      ],
    },
    {
      heading: "4. Regulatory",
      body: [
        "The regulatory status of digital assets is uncertain and varies by jurisdiction. It is your responsibility to determine whether participation is lawful where you live.",
      ],
    },
    {
      heading: "5. Forward-looking statements",
      body: [
        "Roadmaps and statements about future plans are subject to change and may not be realized. They should not be relied upon as commitments.",
      ],
    },
  ],
};
