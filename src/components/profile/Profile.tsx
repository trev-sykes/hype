import styles from "./Profile.module.css";
import { useAccount, useEnsName, useDisconnect } from 'wagmi';
import { BounceLoader } from "react-spinners";

export function Profile({ openConnector }: any) {
    const { address, isConnected } = useAccount();
    const { data: ensName, status: ensStatus } = useEnsName({ address });
    const { disconnect } = useDisconnect();

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
                <div
                    className={styles.section}
                >
                    <a
                        href={`https://etherscan.io/address/${address}`}
                        rel="norel"
                        target="_blank"
                        className={styles.address}
                    >
                        {ensLoading ? (
                            <BounceLoader size={14} />
                        ) : ensName || ""}
                        {ensName ? " (" : ""}
                        {formattedAddress}
                        {ensName ? ")" : ""}
                    </a>
                    <button onClick={handleClick} className={styles.disconnectButton}>
                        Log Out
                    </button>
                </div>
            ) : (
                <button onClick={handleClick} className={styles.connectButton}>
                    Log In
                </button>
            )
            }
        </div >
    );
}
