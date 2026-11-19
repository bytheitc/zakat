# Printable Zakat Calculation Statement

## Overview

This branch focuses on implementing a printable A4 statement for the Zakat Kit calculation results.

The objective is to allow users to generate a clear, well-structured and printable record of their zakat calculations, including the calculation summary and supporting breakdown.

## Objectives

- Introduce a print action within the calculation results interface.
- Develop a dedicated statement layout suitable for A4 printing.
- Display the relevant calculation details, including the selected nisab basis, zakatable assets, liabilities, net wealth and calculated result.
- Include an itemised breakdown of the underlying financial information.
- Apply print-specific styling to remove unnecessary application interface elements.
- Ensure the statement remains readable when printed or saved as PDF.

## Implementation Approach

The implementation will reuse the existing calculation results and data structures rather than introduce a separate calculation mechanism.

The printable statement will be integrated with the existing results interface, with dedicated print styles to control page layout, spacing, typography and visibility of interface elements.

## Functional Considerations

- Preserve the existing calculation logic and displayed results.
- Clearly represent incomplete calculations and missing currency conversions.
- Reflect the user's selected calculation preferences, including gold or silver nisab and lunar or solar year basis.
- Ensure the statement does not present the calculator's output as a religious ruling.
- Maintain accessibility and consistency with the existing application design.

## Testing and Validation

The implementation will be tested to ensure:

- The print action works correctly.
- The statement renders appropriately on A4 paper.
- Calculation figures and breakdowns correspond to the application results.
- Incomplete calculations are clearly identified.
- The existing calculator functionality remains unaffected.
- The output is readable in both colour and black-and-white.

## Scope

This branch is limited to the printable zakat calculation statement requested in [Issue #3](https://github.com/bytheitc/zakat/issues/3).

Further enhancements outside this scope will be considered separately.