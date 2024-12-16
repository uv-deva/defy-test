"use client";

import React, { useEffect, useState } from "react";
import {
  getAssetsByOwner,
  fetchNFTDetails,
  extractGroupAddress,
} from "@/utils/getAssets";
import Image from "next/image";
import Link from "next/link";
import { FaExternalLinkAlt } from "react-icons/fa";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import Card from "@/components/Card";
import Skeleton from "@/components/Skeleton";
import { getNFTDetail, getNFTList } from "@/utils/nftMarket";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export interface NFTDetail {
  name: string;
  symbol: string;
  image?: string;
  collection?: string;
  group?: string;
  mint: string;
  seller: string;
  price: string;
  listing: string;
}

const trimAddress = (address: string) =>
  `${address.slice(0, 4)}...${address.slice(-4)}`;

const Closet: React.FC = () => {
  const { publicKey } = useWallet();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [assets, setAssets] = useState<NFTDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [collection, setCollection] = useState<NFTDetail[]>([]);
  const [collectionStatus, setCollectionStatus] = useState<boolean>(false);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [minPriceValue, setMinPriceValue] = useState<string>("");
  const [maxPriceValue, setMaxPriceValue] = useState<string>("");
  const [selectedCollectionValue, setSelectedCollectionValue] = useState<string>("");
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  useEffect(() => {
    fetchNFTs();
  }, [wallet, minPrice, maxPrice, selectedCollection]);

  useEffect(() => {
    sessionStorage.setItem("walletAddress", walletAddress);
  }, [walletAddress]);

  useEffect(() => {
    sessionStorage.setItem("assets", JSON.stringify(assets));
  }, [assets]);

  const fetchNFTs = async () => {
    setIsLoading(true);
    const provider = new AnchorProvider(connection, wallet as Wallet, {});

    try {
      const minPriceValue = minPrice ? parseFloat(minPrice) : null;
      const maxPriceValue = maxPrice ? parseFloat(maxPrice) : null;
      const selectedCollectionValue = selectedCollection || null;
    
      const listings = await getNFTList(provider, connection, minPriceValue, maxPriceValue);
      const promises = listings
        .filter((list) => list.isActive)
        .map((list) => {
          const mint = new PublicKey(list.mint);
          return getNFTDetail(
            mint,
            connection,
            list.seller,
            list.price,
            list.pubkey,
            selectedCollectionValue
          );
        });
      const detailedListings = (await Promise.all(promises)).filter((nft) => nft !== null);
      setAssets(detailedListings);
      if(!collectionStatus) { setCollection(detailedListings); }
      setCollectionStatus(true)
    } catch (err) {
      console.error(err);
      setError("Failed to load NFTs.");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    setMinPrice(minPriceValue);
    setMaxPrice(maxPriceValue);
    setSelectedCollection(selectedCollectionValue);
  };

  const uniqueCollections = Array.from(
    new Set(collection.map((collection) => collection.collection).filter((collection) => collection))
  );
  return (
    <div className="p-4 pt-20 bg-white dark:bg-black min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-center text-black dark:text-white">
        NFTs on Sale
      </h1>

      {error && <div className="text-red-500 text-center mb-4">{error}</div>}

      <div className="flex justify-end mb-6 gap-4">
        <input
          type="number"
          placeholder="Min Price"
          value={minPriceValue}
          onChange={(e) => setMinPriceValue(e.target.value)}
          className="p-2 border rounded"
          style={{ width: '125px' }}
        />
        <input
          type="number"
          placeholder="Max Price"
          value={maxPriceValue}
          onChange={(e) => setMaxPriceValue(e.target.value)}
          className="p-2 border rounded"
          style={{ width: '125px' }}
        />
        <select
          value={selectedCollectionValue}
          onChange={(e) => setSelectedCollectionValue(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All Collections</option>
          {uniqueCollections.map((collection) => (
            <option key={collection} value={collection || ""}>
              {trimAddress(collection || "")}
            </option>
          ))}
        </select>
        <button
          onClick={applyFilters}
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Apply
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index}>
              <Skeleton className="h-64 w-full mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : assets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.mint}
              className="relative p-4 border rounded shadow hover:shadow-lg transition-transform transform hover:scale-105 cursor-pointer bg-white dark:bg-black group"
            >
              <Link href={`/marketplace/${asset.mint}`}>
                <div className="relative h-64 w-full mb-4">
                  {asset.image ? (
                    <Image
                      src={asset.image}
                      alt={`Asset ${asset.mint}`}
                      layout="fill"
                      objectFit="contain"
                      className="rounded"
                    />
                  ) : (
                    <p>No Image Available</p>
                  )}
                </div>
              </Link>
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-opacity flex flex-col justify-end items-center opacity-0 group-hover:opacity-100 text-white text-xs p-2">
                <p className="font-semibold">{asset.name || "Unknown"}</p>
                <Link
                  href={`https://solana.fm/address/${asset.mint}`}
                  target="_blank"
                  className="hover:text-gray-300 flex items-center"
                >
                  {trimAddress(asset.mint)} <FaExternalLinkAlt className="ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <h2 className="text-2xl font-bold mb-4 text-center text-red-500 dark:text-yellow">
          No NFTs on sale
        </h2>
      )}
    </div>
  );
};

export default Closet;
