import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronUp, ChevronDown, Home, User, Compass, Plus, Info } from 'lucide-react';
import { Profile } from '../profile/Profile';
import styles from './DashboardNav.module.css';
import { useNavStore } from '../../store/navStore';

const DashboardNav = ({ openConnector }: any) => {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const { setNavExpanded, isNavExpanded } = useNavStore();
    const [isMobile, setIsMobile] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setIsCollapsed(true);
    }, [location]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const navItems = [
        { to: "/", label: "Home", icon: Home, end: true },
        { to: "/account/", label: "Account", icon: User, end: true },
        { to: "/explore", label: "Explore", icon: Compass },
        { to: "/create", label: "Create", icon: Plus },
        { to: "/about", icon: Info }
    ];

    return (
        <nav
            className={`${styles.desktopNav} ${isCollapsed ? styles.collapsed : ''}`}
        >
            <button
                className={styles.toggleButton}
                onClick={() => {
                    setIsCollapsed(!isCollapsed)
                    console.log("IS nav expanded; ", isNavExpanded);
                    setNavExpanded(prev => !prev);

                }}
                aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            >
                {isCollapsed ? <ChevronUp size={isMobile ? 18 : 20} /> : <ChevronDown size={isMobile ? 18 : 20} />}
            </button>
            <div className={`${styles.navContent} ${isCollapsed ? styles.hidden : ''}`}>
                <div className={styles.navLinks}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                        >
                            <item.icon size={isMobile ? 16 : 18} />
                            {typeof item.label === 'string' && (
                                <span className={styles.navLabel}>{item.label}</span>
                            )}
                        </NavLink>
                    ))}

                </div>
                <div className={styles.profileContainer}>
                    <Profile openConnector={openConnector} />
                </div>
            </div>
        </nav>
    );
};

export default DashboardNav;