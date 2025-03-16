'use client';

import React, { useState, useMemo } from 'react';
import { 
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState as TanstackSortingState
} from '@tanstack/react-table';
import { FeedbackData, FeedbackDataArray } from '@/types/feedback';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Shield, 
  ExternalLink,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FeedbackVerificationTableProps {
  readonly data: FeedbackDataArray;
}

/**
 * Component for displaying feedback verification data with sorting and filtering
 */
export function FeedbackVerificationTable({ 
  data 
}: FeedbackVerificationTableProps): React.ReactElement {
  const [sorting, setSorting] = useState<TanstackSortingState>([]);
  
  // Use column helper for type safety
  const columnHelper = createColumnHelper<FeedbackData>();
  
  // Define columns with proper type
  const columns = useMemo(() => [
    columnHelper.accessor('username', {
      header: 'User',
      cell: info => (
        <div className="font-medium">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor('content', {
      header: 'Feedback',
      cell: info => <div className="max-w-md truncate">{info.getValue()}</div>,
    }),
    columnHelper.accessor('timestamp', {
      header: 'Date',
      cell: info => {
        const date = new Date(info.getValue());
        return <div>{date.toLocaleDateString()}</div>;
      },
    }),
    columnHelper.accessor('verificationLevel', {
      header: 'Verification',
      cell: info => {
        const level = info.getValue();
        
        const badgeColorMap = {
          pending: 'bg-gray-200 text-gray-800',
          low: 'bg-red-100 text-red-800',
          medium: 'bg-yellow-100 text-yellow-800',
          high: 'bg-green-100 text-green-800',
          verified: 'bg-blue-100 text-blue-800',
        } as const;
        
        const iconMap = {
          pending: <Clock className="h-4 w-4 mr-1" />,
          low: <XCircle className="h-4 w-4 mr-1" />,
          medium: <AlertTriangle className="h-4 w-4 mr-1" />,
          high: <Shield className="h-4 w-4 mr-1" />,
          verified: <CheckCircle className="h-4 w-4 mr-1" />,
        } as const;
        
        const badgeColor = badgeColorMap[level];
        const icon = iconMap[level];
        
        return (
          <Badge variant="outline" className={`flex items-center ${badgeColor}`}>
            {icon}
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </Badge>
        );
      },
    }),
    columnHelper.accessor('socialScore', {
      header: 'Social Score',
      cell: info => {
        const score = info.getValue();
        const getColor = () => {
          if (score < 30) return 'text-red-500';
          if (score < 60) return 'text-yellow-500';
          return 'text-green-500';
        };
        
        return (
          <div className={`font-medium ${getColor()}`}>
            {score}/100
          </div>
        );
      },
    }),
    columnHelper.accessor('blockchainTxId', {
      header: 'Blockchain',
      cell: info => {
        const txId = info.getValue();
        
        if (!txId) {
          return <span className="text-gray-400">Not verified</span>;
        }
        
        const shortTxId = `${txId.substring(0, 6)}...${txId.substring(txId.length - 4)}`;
        
        return (
          <Button 
            variant="link" 
            className="p-0 h-6 flex items-center text-blue-600"
            onClick={() => window.open(`https://etherscan.io/tx/${txId}`, '_blank')}
          >
            {shortTxId}
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        );
      },
    }),
  ], [columnHelper]);

  // Create table instance with proper type handling
  const table = useReactTable({
    data: [...data], // Convert readonly array to mutable array
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead 
                  key={header.id}
                  className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {{
                      asc: <ArrowUp className="ml-1 h-4 w-4" />,
                      desc: <ArrowDown className="ml-1 h-4 w-4" />,
                    }[header.column.getIsSorted() as string] ?? null}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map(row => (
            <TableRow 
              key={row.id}
              className="hover:bg-gray-50"
            >
              {row.getVisibleCells().map(cell => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
