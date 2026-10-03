import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { INITIAL_REQUESTS } from "../constants/providerData";

const ProviderContext = createContext(null);

/**
 * Shared state for the service provider area (online status and booking
 * requests) so the tab badge, dashboard and requests screen stay in sync.
 */
export const ProviderDataProvider = ({ children }) => {
  const [online, setOnline] = useState(true);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);

  // TODO: call providerService to accept / reject on the backend.
  const acceptRequest = useCallback(
    (id) => setRequests((list) => list.filter((r) => r.id !== id)),
    []
  );
  const rejectRequest = useCallback(
    (id) => setRequests((list) => list.filter((r) => r.id !== id)),
    []
  );

  const value = useMemo(
    () => ({
      online,
      setOnline,
      requests,
      acceptRequest,
      rejectRequest,
      pendingCount: requests.length,
      urgentCount: requests.filter((r) => r.urgent).length,
    }),
    [online, requests, acceptRequest, rejectRequest]
  );

  return <ProviderContext.Provider value={value}>{children}</ProviderContext.Provider>;
};

export const useProviderData = () => {
  const ctx = useContext(ProviderContext);
  if (!ctx) throw new Error("useProviderData must be used inside ProviderDataProvider");
  return ctx;
};

export default ProviderContext;
