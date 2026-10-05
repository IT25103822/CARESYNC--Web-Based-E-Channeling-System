package com.sliit.echanneling.payment.dto;

import java.math.BigDecimal;

public class ReconciliationSummaryDto {
    private long totalTransactions;
    private BigDecimal totalRevenue;
    private long totalRefunds;
    private BigDecimal totalRefundAmount;
    private BigDecimal netRevenue;

    public ReconciliationSummaryDto(long totalTransactions, BigDecimal totalRevenue, long totalRefunds, BigDecimal totalRefundAmount, BigDecimal netRevenue) {
        this.totalTransactions = totalTransactions;
        this.totalRevenue = totalRevenue;
        this.totalRefunds = totalRefunds;
        this.totalRefundAmount = totalRefundAmount;
        this.netRevenue = netRevenue;
    }

    public long getTotalTransactions() { return totalTransactions; }
    public void setTotalTransactions(long totalTransactions) { this.totalTransactions = totalTransactions; }

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }

    public long getTotalRefunds() { return totalRefunds; }
    public void setTotalRefunds(long totalRefunds) { this.totalRefunds = totalRefunds; }

    public BigDecimal getTotalRefundAmount() { return totalRefundAmount; }
    public void setTotalRefundAmount(BigDecimal totalRefundAmount) { this.totalRefundAmount = totalRefundAmount; }

    public BigDecimal getNetRevenue() { return netRevenue; }
    public void setNetRevenue(BigDecimal netRevenue) { this.netRevenue = netRevenue; }
}
