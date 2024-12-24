import { env } from "~/env";
import {
  DEFAULT_START_TIME,
  TIME_INTERVAL_SECONDS,
  TimeInterval,
} from "./charts";
import { FilterType } from "~/server/api/routers/types";

export const getCollectionDataQueryDefaultConfig = ({
  collectionAddress,
  filter,
  startTime,
  timeInterval,
}: {
  collectionAddress?: string;
  filter?: FilterType;
  startTime?: number;
  timeInterval: TimeInterval;
}) => {
  return {
    collectionAddress: collectionAddress || env.NEXT_PUBLIC_COLLECTION_ADDRESS,
    filter: filter || FilterType.NATIVE,
    startTime: startTime || DEFAULT_START_TIME,
    endTime: getEndTime(timeInterval),
    timeInterval,
  };
};

export const getEndTime = (timeInterval: TimeInterval) => {
  const endTime = Math.floor(Date.now() / 1000);
  const intervalInSeconds = TIME_INTERVAL_SECONDS[timeInterval];
  return Math.floor(endTime / intervalInSeconds) * intervalInSeconds;
};

type GetCollectionAddressOptions = {
  collectionAddress?: string;
};
export const getCollectionAddress = (options?: GetCollectionAddressOptions) => {
  return {
    collectionAddress:
      options?.collectionAddress || env.NEXT_PUBLIC_COLLECTION_ADDRESS,
  };
};
