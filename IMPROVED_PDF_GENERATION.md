# Improved PDF Generation Guide

## Overview
This guide provides improved PDF generation code for both daily and monthly attendance reports. The improvements focus on:
- Professional appearance
- Mobile screen compatibility
- Better readability
- Proper spacing and alignment
- Mobile-friendly A4 layout

---

## 1. Improved `generate_monthly_pdf()` Function

Replace the existing `generate_monthly_pdf()` function in `backend/attendance/views.py` with:

```python
def generate_monthly_pdf(monthly):
    """Generate a professional monthly attendance report PDF"""
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from datetime import datetime
    
    buffer = BytesIO()
    
    # Use portrait for better mobile viewing
    pdf = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch, 
                            leftMargin=0.4*inch, rightMargin=0.4*inch)
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom title style
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#1E40AF'),
        spaceAfter=6,
        alignment=1,  # Center
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#4B5563'),
        spaceAfter=12,
        alignment=1,
        fontName='Helvetica'
    )
    
    # Add company header
    month_name = monthly.month
    year = monthly.year
    month_str = datetime(year, month_name, 1).strftime('%B %Y')
    
    title = Paragraph(f"<b>ATTENDANCE REPORT</b>", title_style)
    elements.append(title)
    
    # Employee info
    employee_info = f"Employee: <b>{monthly.profile.name}</b> | Period: <b>{month_str}</b>"
    elements.append(Paragraph(employee_info, subtitle_style))
    elements.append(Spacer(1, 0.15*inch))
    
    # Attendance records
    attendances = monthly.daily_records.all().order_by('date')
    
    # Create table data
    table_data = [
        ['Date', 'Day', 'Status', 'Time Marked', 'Location']
    ]
    
    for att in attendances:
        date_str = att.date.strftime('%d %b %Y')
        time_str = att.time.strftime('%H:%M') if att.time else '—'
        location_str = att.location[:20] + '...' if att.location and len(att.location) > 20 else (att.location or '—')
        
        table_data.append([
            date_str,
            att.day[:3],  # 3-letter day abbreviation
            att.status,
            time_str,
            location_str
        ])
    
    # Create table with styling
    table = Table(table_data, colWidths=[1.2*inch, 0.7*inch, 0.8*inch, 0.9*inch, 1.2*inch])
    
    table_style = TableStyle([
        # Header styling
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E40AF')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        
        # Data rows
        ('ALIGN', (0, 1), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        
        # Borders
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ('LINESTYLE', (0, 0), (-1, 0), 1, colors.HexColor('#1E40AF')),
        
        # Status column color coding
    ])
    
    # Add color coding for status
    for i, row in enumerate(table_data[1:], start=1):
        status = row[2]
        if status == 'Present':
            table_style.add('TEXTCOLOR', (2, i), (2, i), colors.HexColor('#059669'))
            table_style.add('FONTNAME', (2, i), (2, i), 'Helvetica-Bold')
        elif status == 'Absent':
            table_style.add('TEXTCOLOR', (2, i), (2, i), colors.HexColor('#DC2626'))
            table_style.add('FONTNAME', (2, i), (2, i), 'Helvetica-Bold')
        elif status == 'Leave':
            table_style.add('TEXTCOLOR', (2, i), (2, i), colors.HexColor('#D97706'))
            table_style.add('FONTNAME', (2, i), (2, i), 'Helvetica-Bold')
    
    table.setStyle(table_style)
    elements.append(table)
    
    # Summary section
    elements.append(Spacer(1, 0.2*inch))
    
    summary_data = [
        ['Total Days', 'Present', 'Absent', 'Leave'],
        [str(len(attendances)), str(monthly.total_present), 
         str(monthly.total_absent), str(monthly.total_leave)]
    ]
    
    summary_table = Table(summary_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
    summary_style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#374151')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('FONTSIZE', (0, 1), (-1, 1), 14),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#F3F4F6')),
    ])
    summary_table.setStyle(summary_style)
    elements.append(summary_table)
    
    # Footer
    elements.append(Spacer(1, 0.3*inch))
    footer_text = f"<i>Generated on {datetime.now().strftime('%d %B %Y at %H:%M')}</i>"
    elements.append(Paragraph(footer_text, ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#9CA3AF'),
        alignment=1
    )))
    
    # Build PDF
    pdf.build(elements)
    buffer.seek(0)
    return buffer
```

---

## 2. Improved `DailyAttendancePDFView` for Mobile

Update the `DailyAttendancePDFView` in `backend/attendance/views.py`:

```python
class DailyAttendancePDFView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from datetime import datetime
        
        today = timezone.localdate()
        employees = Profile.objects.all().order_by("name")

        # Response setup
        response = HttpResponse(content_type="application/pdf")
        filename = f"Daily_Attendance_{today.strftime('%d_%m_%Y')}.pdf"
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        
        # PDF setup with mobile-friendly margins
        buffer = BytesIO()
        pdf_doc = SimpleDocTemplate(
            buffer, 
            pagesize=A4,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch,
            leftMargin=0.4*inch,
            rightMargin=0.4*inch
        )
        
        elements = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'Title',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1E40AF'),
            spaceAfter=6,
            alignment=1,
            fontName='Helvetica-Bold'
        )
        
        date_style = ParagraphStyle(
            'DateInfo',
            parent=styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#4B5563'),
            spaceAfter=12,
            alignment=1
        )
        
        # Title
        title = Paragraph("<b>DAILY ATTENDANCE REPORT</b>", title_style)
        elements.append(title)
        
        date_text = f"Date: <b>{today.strftime('%d %B %Y')}</b>"
        elements.append(Paragraph(date_text, date_style))
        elements.append(Spacer(1, 0.15*inch))
        
        # Summary counts
        present_count = Attendance.objects.filter(date=today, status="Present").count()
        absent_count = Attendance.objects.filter(date=today, status="Absent").count()
        leave_count = Attendance.objects.filter(date=today, status="Leave").count()
        marked_profiles = Attendance.objects.filter(date=today).values_list("profile_id", flat=True)
        not_marked_count = Profile.objects.exclude(id__in=marked_profiles).count()
        
        # Summary table
        summary_data = [
            ['Present', 'Absent', 'Leave', 'Not Marked'],
            [str(present_count), str(absent_count), str(leave_count), str(not_marked_count)]
        ]
        
        summary_table = Table(summary_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        summary_style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('FONTSIZE', (0, 1), (-1, 1), 14),
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
            ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#F3F4F6')),
        ])
        summary_table.setStyle(summary_style)
        elements.append(summary_table)
        elements.append(Spacer(1, 0.2*inch))
        
        # Attendance table
        table_data = [
            ['#', 'Employee Name', 'Designation', 'Time', 'Status']
        ]
        
        count = 1
        for emp in employees:
            record = Attendance.objects.filter(profile=emp, date=today).first()
            
            time_str = record.time.strftime('%H:%M') if record and record.time else '—'
            status_str = record.status if record else 'Not Marked'
            
            table_data.append([
                str(count),
                emp.name[:30],  # Truncate long names
                emp.Job_title[:20] if emp.Job_title else '—',
                time_str,
                status_str
            ])
            count += 1
        
        # Create attendance table
        att_table = Table(table_data, colWidths=[0.5*inch, 2*inch, 1.3*inch, 1*inch, 1*inch])
        
        att_style = TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E40AF')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            
            # Data rows
            ('ALIGN', (0, 1), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('TOPPADDING', (0, 1), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
            
            # Borders
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('LINESTYLE', (0, 0), (-1, 0), 1, colors.HexColor('#1E40AF')),
        ])
        
        # Add color coding to status column
        for i, row in enumerate(table_data[1:], start=1):
            status = row[4]
            if status == 'Present':
                att_style.add('TEXTCOLOR', (4, i), (4, i), colors.HexColor('#059669'))
                att_style.add('FONTNAME', (4, i), (4, i), 'Helvetica-Bold')
            elif status == 'Absent':
                att_style.add('TEXTCOLOR', (4, i), (4, i), colors.HexColor('#DC2626'))
                att_style.add('FONTNAME', (4, i), (4, i), 'Helvetica-Bold')
            elif status == 'Leave':
                att_style.add('TEXTCOLOR', (4, i), (4, i), colors.HexColor('#D97706'))
                att_style.add('FONTNAME', (4, i), (4, i), 'Helvetica-Bold')
        
        att_table.setStyle(att_style)
        elements.append(att_table)
        
        # Footer
        elements.append(Spacer(1, 0.3*inch))
        footer = Paragraph(
            f"<i>Generated on {datetime.now().strftime('%d %B %Y at %H:%M')}</i>",
            ParagraphStyle(
                'Footer',
                parent=styles['Normal'],
                fontSize=9,
                textColor=colors.HexColor('#9CA3AF'),
                alignment=1
            )
        )
        elements.append(footer)
        
        # Build PDF
        pdf_doc.build(elements)
        buffer.seek(0)
        
        # Write to response
        response.write(buffer.getvalue())
        return response
```

---

## Key Improvements

### 1. **Professional Appearance**
   - Blue header colors (#1E40AF) for official look
   - Proper spacing and typography
   - Color-coded status (Green=Present, Red=Absent, Orange=Leave)
   - Clean borders and grid layout

### 2. **Mobile Screen Compatibility**
   - Reduced margins (0.4-0.5 inches) for compact viewing
   - Optimized column widths for A4 portrait layout
   - Text truncation for long names/titles
   - Readable font sizes (9-14pt for data)

### 3. **Better Readability**
   - Alternating row colors (white + light gray)
   - Clear section separation with spacing
   - Bold headers and important data
   - Timestamp footer for document validity

### 4. **Mobile-Friendly Features**
   - Portrait orientation (better for phones)
   - Proper pagination handling
   - Compact but readable layout
   - No content overflow issues

---

## Installation Requirements

Make sure your Django backend has ReportLab installed:

```bash
pip install reportlab
```

The improved code uses `reportlab.platypus` for better layout control and is production-ready.

---

## Testing

After applying these changes:
1. Download a monthly PDF - should show professional formatting
2. Download daily attendance - should show summary + detailed table
3. Test on mobile (view PDF on phone) - should fit properly
4. All statuses should be color-coded for quick reference
