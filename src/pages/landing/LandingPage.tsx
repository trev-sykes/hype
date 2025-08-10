import { Link } from 'react-router-dom';
import styles from './LandingPage.module.css';
import Logo from '../../components/logo/Logo';

const LandingPage = () => {
    return (
        <main className={styles.container}>
            <div className={styles.content}>
                <div className={styles.logoContainer}>
                    <Logo size="8rem" />
                </div>

                <h1 className={styles.title}>Welcome to Hype</h1>

                <p className={styles.tagline}>
                    Create your own digital coin that gets more valuable as more people want it.
                    Simple, secure, and built on proven blockchain technology.
                </p>

                <div className={styles.features}>
                    <div className={styles.feature}>
                        <span className={styles.icon}>💎</span>
                        <p><strong>Value Grows</strong> — Your coin's worth increases as demand rises through dynamic market mechanics.</p>
                    </div>
                    <div className={styles.feature}>
                        <span className={styles.icon}>💰</span>
                        <p><strong>Creator Incentives</strong> — Earn fees from every mint while growing your community and token value.</p>
                    </div>
                    <div className={styles.feature}>
                        <span className={styles.icon}>🎨</span>
                        <p><strong>Fully Customizable</strong> — Design your coin with custom names, symbols, and unique branding elements.</p>
                    </div>
                    <div className={styles.feature}>
                        <span className={styles.icon}>⚡</span>
                        <p><strong>Instant Trading</strong> — Buy, sell, and trade your coins instantly with lightning-fast transactions.</p>
                    </div>
                </div>

                <Link to="/dashboard/" className={styles.enterButtonLink}>
                    <button className={styles.enterButton}>
                        <span className={styles.buttonText}>Get Started</span>
                        <span className={styles.buttonArrow}>→</span>
                    </button>
                </Link>
            </div>
        </main>
    );
};

export default LandingPage;