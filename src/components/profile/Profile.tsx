import styles from "./Profile.module.css";
import { useAccount, useEnsName, useDisconnect } from 'wagmi';
import { useState } from 'react';
import { BounceLoader } from "react-spinners";

export function Profile({ openConnector }: any) {
    const { address, isConnected } = useAccount();
    const { data: ensName, status: ensStatus } = useEnsName({ address });
    const { disconnect } = useDisconnect();
    const [hovered, setHovered] = useState(false);

    const ensLoading = ensStatus === 'pending';
    const formattedAddress = address ? `0x...${address.slice(-5)}` : '';

    const handleClick = () => {
        if (isConnected) {
            disconnect(); // log out
        } else {
            openConnector(); // open ConnectWallet modal
        }
    };

    return (
        <div className={styles.profileContainer}>
            {isConnected ? (
                <div className={styles.section}>
                    <span
                        className={styles.address}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                    >
                        {ensLoading ? (
                            <BounceLoader size={14} />
                        ) : ensName || ""}
                        {ensName ? " (" : ""}
                        {hovered ? address : formattedAddress}
                        {ensName ? ")" : ""}
                    </span>
                    <button onClick={handleClick} className={styles.disconnectButton}>
                        Log Out
                    </button>
                </div>
            ) : (
                <button onClick={handleClick} className={styles.connectButton}>
                    Log In
                </button>
            )}
        </div>
    );
}
