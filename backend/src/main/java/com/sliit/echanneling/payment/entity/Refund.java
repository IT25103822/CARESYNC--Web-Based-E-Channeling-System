package com.sliit.echanneling.payment.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Digital Receipt Entity
 * Member 6: Brahmananayaka N.M (IT25103825) - Payment Management
 */
@Entity
@Table(name = "Receipts")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Receipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ReceiptId")
    private Integer receiptId;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "PaymentId", nullable = false, unique = true)
    private Payment payment;

    @Column(name = "ReceiptNumber", nullable = false, unique = true, length = 100)
    private String receiptNumber;

    @Column(name = "IssueDate", nullable = false)
    private LocalDateTime issueDate = LocalDateTime.now();

    @Column(name = "ReceiptDetails", columnDefinition = "NVARCHAR(MAX)")
    private String receiptDetails;

    public Receipt() {}

    public Receipt(Payment payment, String receiptNumber, String receiptDetails) {
        this.payment = payment;
        this.receiptNumber = receiptNumber;
        this.receiptDetails = receiptDetails;
        this.issueDate = LocalDateTime.now();
    }

    // Getters and Setters
    public Integer getReceiptId() { return receiptId; }
    public void setReceiptId(Integer receiptId) { this.receiptId = receiptId; }

    public Payment getPayment() { return payment; }
    public void setPayment(Payment payment) { this.payment = payment; }

    public String getReceiptNumber() { return receiptNumber; }
    public void setReceiptNumber(String receiptNumber) { this.receiptNumber = receiptNumber; }

    public LocalDateTime getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDateTime issueDate) { this.issueDate = issueDate; }

    public String getReceiptDetails() { return receiptDetails; }
    public void setReceiptDetails(String receiptDetails) { this.receiptDetails = receiptDetails; }
}
