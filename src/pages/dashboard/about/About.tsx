import styles from './About.module.css';
import Logo from '../../../components/logo/Logo';

const features = [
    "Bonding Curve Pricing",
    "ETH-Backed Tokens",
    "Creator Fees",
    "Custom Metadata",
];

const About = () => {
    return (
        <main className={styles.container}>
            <div className={styles.content}>
                <h1>About Hype</h1>
                <div className={styles.logoContainer} aria-label="Homepage">
                    <Logo background={true} size="8rem" />
                </div>
                <p className={styles.tagline}>
                    Hype is a decentralized marketplace for creating and trading ETH-backed tokens with quadratic bonding curves. Launch custom tokens with unique metadata, mint to buy low, burn to sell high, with prices adjusting dynamically based on supply. Creators earn 0.5% on mints in a transparent, ETH-reserved economy.
                </p>

                <h3>Features</h3>
                <div className={styles.features}>
                    {features.map((feature) => (
                        <div key={feature} className={styles.feature}>
                            {feature}
                        </div>
                    ))}
                </div>

                <div className={styles.links}>
                    <a href="https://etherscan.io/address/0xcDAd81928F637B10f97250B641fC7DFB687A3b32" target="_blank" rel="noopener noreferrer">
                        View Smart Contract
                    </a>
                    <a href="https://twitter.com/@hypeiteth" target="_blank" rel="noopener noreferrer">
                        Follow us on Twitter
                    </a>
                </div>
            </div>
        </main>
    );
};

export default About;
