// Auto-generated file - DO NOT EDIT
// This file contains all bundled CSS including CSS modules
export const bundledCss = `.Errors-module_errors__fyHDX {
  color: var(--color-text-error);
  margin: var(--m-xxs) 0;
}
.Errors-module_errors__fyHDX p {
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--m-xxs);
  text-align: left;
}
.Errors-module_centered__RHKZi {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 100%;
}
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
.Stepper-module_stepper__8qdlg {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  width: 100%;
  margin: 2rem auto;
  padding: 0 2rem;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
  position: relative;
}
@media (max-width: 640px) {
  .Stepper-module_stepper__8qdlg {
    margin: 1rem auto;
    padding: 0 1rem;
  }
}
@media (max-width: 480px) {
  .Stepper-module_stepper__8qdlg {
    display: none; /* Hide the stepper on mobile */
  }
}
.Stepper-module_step__HvpHj {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  max-width: 200px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.3s ease-out;
}
.Stepper-module_step__HvpHj:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 20px;
  left: calc(50% + 30px);
  width: calc(100% - 60px);
  height: 2px;
  background: #E5E7EB;
  transition: all 0.3s ease-out;
  z-index: -1;
}
.Stepper-module_step__HvpHj.Stepper-module_done__ESA8M:not(:last-child)::after {
  background: var(--color-primary);
}
.Stepper-module_step__HvpHj .Stepper-module_badge__FiGUZ {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 2px solid #E5E7EB;
  color: #6B7280;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease-out;
  position: relative;
  z-index: 1;
}
.Stepper-module_step__HvpHj .Stepper-module_badge__FiGUZ svg {
  width: 16px;
  height: 16px;
}
.Stepper-module_step__HvpHj .Stepper-module_label__0j9-q {
  margin-top: 8px;
  font-size: 13px;
  color: #6B7280;
  font-weight: 500;
  transition: all 0.3s ease-out;
  text-align: center;
  white-space: nowrap;
}
@media (max-width: 640px) {
  .Stepper-module_step__HvpHj .Stepper-module_label__0j9-q {
    display: none;
  }
}
.Stepper-module_step__HvpHj.Stepper-module_active__HLlcf .Stepper-module_badge__FiGUZ {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(122, 94, 248, 0.1);
}
.Stepper-module_step__HvpHj.Stepper-module_active__HLlcf .Stepper-module_label__0j9-q {
  color: var(--color-primary);
  font-weight: 600;
}
.Stepper-module_step__HvpHj.Stepper-module_done__ESA8M .Stepper-module_badge__FiGUZ {
  background: var(--color-primary-100, #EDE9FE);
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.Stepper-module_step__HvpHj.Stepper-module_done__ESA8M .Stepper-module_label__0j9-q {
  color: #111827;
}
.Stepper-module_step__HvpHj:hover:not(.Stepper-module_active__HLlcf):not(.Stepper-module_done__ESA8M) .Stepper-module_badge__FiGUZ {
  border-color: var(--color-primary-300, #C4B5FD);
  background: var(--color-primary-50, #F5F3FF);
}
@media (min-width: 768px) {
  .Stepper-module_step__HvpHj.Stepper-module_stepWide__ZM0Ey .Stepper-module_label__0j9-q {
    display: block;
  }
}
.Stepper-module_stepper-legacy__EOFYx {
  display: flex;
  gap: var(--m);
  margin: var(--m-xs) auto;
  justify-content: center;
}
@media (max-width: 480px) {
  .Stepper-module_stepper-legacy__EOFYx {
    display: none;
  }
}
.Stepper-module_stepper-legacy__EOFYx .Stepper-module_step__HvpHj {
  display: flex;
  gap: var(--m-xxs);
  align-items: center;
  transition: all 0.3s ease-out;
}
.Stepper-module_stepper-legacy__EOFYx .Stepper-module_step__HvpHj .Stepper-module_badge__FiGUZ {
  border-radius: 50%;
  border: 1px solid var(--color-border);
  aspect-ratio: 1;
  width: 2em;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease-out;
}
.Stepper-module_stepper-legacy__EOFYx .Stepper-module_step__HvpHj.Stepper-module_active__HLlcf {
  color: var(--color-primary);
}
.Stepper-module_stepper-legacy__EOFYx .Stepper-module_step__HvpHj.Stepper-module_active__HLlcf .Stepper-module_badge__FiGUZ {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  border: none;
}
.Stepper-module_stepper-legacy__EOFYx .Stepper-module_step__HvpHj.Stepper-module_done__ESA8M .Stepper-module_badge__FiGUZ {
  border-color: var(--color-primary);
}
.Stepper-module_stepper-legacy__EOFYx .Stepper-module_step__HvpHj:not(:first-of-type):before {
  content: "";
  height: 1px;
  width: min(140px, 4vw);
  background-color: var(--color-border);
  border-radius: 2px;
  margin-right: var(--m-xs);
}
.Stepper-module_stepper-legacy__EOFYx .Stepper-module_stepWide__ZM0Ey:not(:first-of-type):before {
  width: min(120px, 10vw);
}
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
.Validation-module_baseContainer__-0AsU, .Validation-module_flexContainer__cBods {
  width: 100%;
  max-width: 100%;
  padding: 1.5rem;
}
@media (max-width: 768px) {
  .Validation-module_baseContainer__-0AsU, .Validation-module_flexContainer__cBods {
    padding: 1rem;
  }
}
@media (max-width: 640px) {
  .Validation-module_baseContainer__-0AsU, .Validation-module_flexContainer__cBods {
    padding: 0.75rem;
  }
}
.Validation-module_flexContainer__cBods {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}
.Validation-module_scrollableContent__d0ytT {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: visible;
  max-width: 100%;
  min-width: 0;
}
.Validation-module_tableContainer__jRikO {
  flex: 1;
  overflow-x: auto;
  overflow-y: auto;
  max-width: 100%;
  -webkit-overflow-scrolling: touch;
}
.Validation-module_tableContainer__jRikO table {
  min-width: 100%;
  width: -moz-max-content;
  width: max-content;
}
.Validation-module_headerSection__drcpg, .Validation-module_header__ocGI2 {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}
.Validation-module_headerSection__drcpg h2, .Validation-module_header__ocGI2 h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}
.Validation-module_headerSection__drcpg p, .Validation-module_header__ocGI2 p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}
.Validation-module_toolbar__-DCj6 {
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
.Validation-module_validationContainer__jrlPR {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 600px;
  max-height: calc(100vh - 2rem);
  height: calc(100vh - 2rem);
  max-width: 100%;
  box-sizing: border-box;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
  margin: 1rem 0;
}
.Validation-module_header__ocGI2 {
  flex-shrink: 0;
  padding: 1.5rem 1.5rem 0 1.5rem;
}
@media (max-width: 640px) {
  .Validation-module_header__ocGI2 {
    padding: 1rem 1rem 0 1rem;
  }
  .Validation-module_header__ocGI2 h2 {
    font-size: 1.125rem;
  }
  .Validation-module_header__ocGI2 p {
    font-size: 0.8125rem;
  }
}
.Validation-module_toolbarSection__Q0YdW {
  flex-shrink: 0;
  padding: 1rem 1.5rem 0 1.5rem;
  background: transparent;
}
@media (max-width: 640px) {
  .Validation-module_toolbarSection__Q0YdW {
    padding: 0.75rem 1rem 0 1rem;
  }
}
.Validation-module_scrollableSection__nwC-B {
  flex: 1 1 auto;
  min-width: 0;
  overflow: auto;
  min-height: 200px;
  margin: 1rem 1.5rem 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  -webkit-overflow-scrolling: touch;
}
.Validation-module_scrollableSection__nwC-B > table {
  border-collapse: collapse;
}
.Validation-module_scrollableSection__nwC-B > table thead {
  position: sticky;
  top: 0;
  z-index: 10;
}
.Validation-module_scrollableSection__nwC-B > table thead th {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}
.Validation-module_scrollableSection__nwC-B > table th:first-child,
.Validation-module_scrollableSection__nwC-B > table td:first-child {
  position: sticky;
  left: 0;
  z-index: 5;
}
.Validation-module_scrollableSection__nwC-B > table thead th:first-child {
  z-index: 11;
}
@media (max-width: 640px) {
  .Validation-module_scrollableSection__nwC-B {
    margin: 0.75rem;
  }
}
.Validation-module_validationContent__hn2Dz {
  padding: 1rem 0;
  width: 100%;
  max-width: 100%;
  overflow: visible;
}
.Validation-module_toolbar__-DCj6 {
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 0;
  margin-top: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
@media (max-width: 640px) {
  .Validation-module_toolbar__-DCj6 {
    padding: 0.75rem;
  }
  .Validation-module_toolbar__-DCj6 > div {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }
}
.Validation-module_errorBadge__yeHS0 {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  background-color: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #dc2626;
  animation: Validation-module_pulse__d-MKR 2s infinite;
}
@keyframes Validation-module_pulse__d-MKR {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.85;
  }
}
.Validation-module_rowCount__h-OSk {
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 400;
}
.Validation-module_tabFilter__DV34i {
  display: inline-flex;
  align-items: center;
  background: #f3f4f6;
  padding: 0.125rem;
  border-radius: 2rem;
}
@media (max-width: 640px) {
  .Validation-module_tabFilter__DV34i {
    width: 100%;
    justify-content: space-between;
  }
}
.Validation-module_tab__JPIkM {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1.25rem;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 1.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  margin: 0;
}
@media (max-width: 640px) {
  .Validation-module_tab__JPIkM {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
    flex: 1;
    justify-content: center;
  }
}
.Validation-module_tab__JPIkM:hover:not(.Validation-module_active__rLvN7) {
  color: #374151;
}
.Validation-module_tab__JPIkM:focus-visible {
  box-shadow: 0 0 0 2px #3b82f6;
  z-index: 1;
}
.Validation-module_tab__JPIkM.Validation-module_active__rLvN7 {
  background: #4b5563;
  color: white;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}
.Validation-module_tab__JPIkM.Validation-module_active__rLvN7 .Validation-module_count__lb09d {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}
.Validation-module_tab__JPIkM .Validation-module_count__lb09d {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  padding: 0.125rem 0.375rem;
  height: 1.25rem;
  background: transparent;
  color: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;
}
.Validation-module_tab__JPIkM.Validation-module_errorTab__ebQQd.Validation-module_active__rLvN7 {
  background: #dc2626;
}
.Validation-module_tab__JPIkM.Validation-module_errorTab__ebQQd.Validation-module_active__rLvN7 .Validation-module_count__lb09d {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}
.Validation-module_tab__JPIkM.Validation-module_errorTab__ebQQd:not(.Validation-module_active__rLvN7) .Validation-module_count__lb09d {
  color: #dc2626;
}
.Validation-module_spreadsheetContainer__VOHHJ {
  width: 100%;
  overflow-x: auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}
.Validation-module_spreadsheetWrapper__jE9rZ {
  position: relative;
}
.Validation-module_spreadsheetTable__OzR-h {
  width: -moz-max-content;
  width: max-content;
  min-width: 800px;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.875rem;
}
.Validation-module_spreadsheetHeader__CcIvW {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #f9fafb;
}
.Validation-module_spreadsheetHeader__CcIvW tr th {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
  padding: 0;
  text-align: left;
  font-weight: 600;
  color: #111827;
  position: relative;
}
.Validation-module_spreadsheetHeader__CcIvW tr th:last-child {
  border-right: none;
}
.Validation-module_rowNumberHeader__hBB39 {
  width: 60px;
  min-width: 60px;
  max-width: 60px;
  text-align: center !important;
  background: #f9fafb !important;
  position: sticky;
  left: 0;
  z-index: 11;
  font-size: 0.75rem;
  padding: 0.75rem 0 !important;
}
.Validation-module_columnHeader__Yjc-8 {
  width: auto;
  min-width: 100px;
}
.Validation-module_columnHeader__Yjc-8 .Validation-module_headerContent__soxS5 {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.Validation-module_spreadsheetBody__ASDqW .Validation-module_dataRow__fAJUe:hover .Validation-module_dataCell__Kqej5 {
  background: #f3f4f6;
}
.Validation-module_spreadsheetBody__ASDqW .Validation-module_dataRow__fAJUe:hover .Validation-module_rowNumber__gW7gl {
  background: rgb(239.82, 242.35, 244.88);
}
.Validation-module_spreadsheetBody__ASDqW .Validation-module_dataRow__fAJUe.Validation-module_errorRow__E5crc .Validation-module_dataCell__Kqej5 {
  background: rgb(254.51, 240.79, 240.79);
}
.Validation-module_rowNumber__gW7gl {
  width: 60px;
  min-width: 60px;
  max-width: 60px;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  padding: 0.75rem 0;
  position: sticky;
  left: 0;
  z-index: 1;
}
.Validation-module_dataCell__Kqej5 {
  width: auto;
  min-width: 100px;
  border-right: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  padding: 0;
  background: white;
  position: relative;
  transition: background-color 0.15s ease;
  white-space: nowrap;
}
.Validation-module_dataCell__Kqej5:last-child {
  border-right: none;
}
.Validation-module_dataCell__Kqej5.Validation-module_errorCell__0EbsM {
  background: #fee2e2;
}
.Validation-module_dataCell__Kqej5.Validation-module_errorCell__0EbsM .Validation-module_cellInput__LsyOo {
  color: #111827;
}
.Validation-module_cellContent__ubxVt {
  position: relative;
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
}
.Validation-module_cellInput__LsyOo {
  width: 100%;
  height: 100%;
  min-height: 40px;
  border: none;
  background: transparent;
  padding: 0.625rem 0.75rem;
  padding-right: 1.75rem;
  font-size: 0.875rem;
  font-family: inherit;
  color: #111827;
  outline: none;
  transition: box-shadow 0.15s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.Validation-module_cellInput__LsyOo:focus {
  box-shadow: inset 0 0 0 2px #3b82f6;
  z-index: 2;
  position: relative;
}
.Validation-module_cellInput__LsyOo:hover {
  background: rgba(0, 0, 0, 0.01);
}
.Validation-module_errorIndicator__2KEsf {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: help;
  z-index: 3;
}
.Validation-module_errorIndicator__2KEsf svg {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}
.Validation-module_emptyState__g41in {
  padding: 3rem;
  text-align: center;
  color: #6b7280;
}
.Validation-module_content__FgF43 {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}
.Validation-module_tableWrapper__YcN6o {
  flex: 1;
  overflow: auto;
  margin-bottom: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.Validation-module_actions__GIqEx {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
}
.Validation-module_errorContainer__dKOJX {
  flex: 1;
  margin: 0 1rem;
}
.Validation-module_errorRow__E5crc td {
  background-color: rgba(255, 0, 0, 0.03);
}
.Validation-module_editableCellContainer__7yPTv {
  position: relative;
  width: 100%;
}
.Validation-module_simpleInput__LhUg- {
  width: 100%;
  padding: 0.25rem;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: all 0.2s;
}
.Validation-module_simpleInput__LhUg-:focus {
  border-color: #3182ce;
  box-shadow: 0 0 0 1px #3182ce;
}
.Validation-module_errorInput__ZWDrT {
  border-color: #e53e3e;
}
.Validation-module_errorInput__ZWDrT:focus {
  border-color: #e53e3e;
  box-shadow: 0 0 0 1px #e53e3e;
}
.Validation-module_errorIcon__NMpp3 {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #e53e3e;
  color: white;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: help;
}
.Validation-module_validationTable__Wh1wk {
  width: 100%;
  border-collapse: collapse;
}
.Validation-module_validationTable__Wh1wk th {
  background-color: #f1f5f9;
  text-transform: none;
  font-weight: 600;
  color: #334155;
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}
.Validation-module_validationTable__Wh1wk th:first-child {
  border-top-left-radius: 8px;
}
.Validation-module_validationTable__Wh1wk th:last-child {
  border-top-right-radius: 8px;
}
.Validation-module_validationTable__Wh1wk td {
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  color: #334155;
}
.Validation-module_validationTable__Wh1wk tr:last-child td:first-child {
  border-bottom-left-radius: 8px;
}
.Validation-module_validationTable__Wh1wk tr:last-child td:last-child {
  border-bottom-right-radius: 8px;
}
.Validation-module_validationTable__Wh1wk tr:hover {
  background-color: #f8fafc;
}
.Validation-module_validationFilters__XqhsC {
  margin-bottom: 1rem;
}
.Validation-module_errorSummary__SYeAr {
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
}
.Validation-module_tableContainer__jRikO {
  flex: 1;
  overflow: auto;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
}
.Validation-module_toolbarActions__12qlG {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
@media (max-width: 640px) {
  .Validation-module_toolbarActions__12qlG {
    width: 100%;
  }
  .Validation-module_toolbarActions__12qlG button {
    flex: 1;
    justify-content: center;
  }
}
.Validation-module_footerSection__pJMfU {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: transparent;
}
.Validation-module_tableWidth__MNjwY {
  width: -moz-max-content;
  width: max-content;
  min-width: 100%;
}
.Main-module_wrapper__VfIYG {
  display: flex;
  flex-direction: column;
  height: auto;
  min-height: 400px;
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
  overflow: auto;
}

.Main-module_content__TpU1t {
  flex: 1;
  overflow: visible;
  min-width: 0;
  width: 100%;
}

.Main-module_status__mz-0I {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--m);
  padding: 0 var(--m-s) var(--m-s) var(--m-s);
}

.Main-module_spinner__ILoPm {
  border: 1px solid var(--color-border);
  margin-top: var(--m);
  padding: var(--m);
  border-radius: var(--border-radius-1);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.Main-module_close__FUs2w.Main-module_close__FUs2w {
  position: absolute;
  right: var(--m-xs, 0.5rem);
  top: var(--m-xs, 0.5rem);
  border-radius: 50%;
  min-width: calc(var(--m-xl) * 36 / 48);
  height: calc(var(--m-xl) * 36 / 48);
  aspect-ratio: 1;
  font-size: var(--font-size-xl);
  padding: 0;
}
.Box-module_box__Dj2zP {
  display: block;
  margin: 0 auto;
  padding: var(--m);
  background-color: var(--color-background-modal);
  border-radius: var(--border-radius-5);
  box-shadow: 0 0 20px var(--color-background-modal-shadow);
  max-width: 100%;
}
.Box-module_box__Dj2zP.Box-module_fluid__cRnoi {
  max-width: none;
}
.Box-module_box__Dj2zP.Box-module_mid__dgKIT {
  max-width: 440px;
}
.Box-module_box__Dj2zP.Box-module_wide__iL5HJ {
  max-width: 660px;
}
.Box-module_box__Dj2zP.Box-module_space-l__twIGn {
  padding: var(--m-l);
}
.Box-module_box__Dj2zP.Box-module_space-mid__XYqv5 {
  padding: var(--m);
}
.Box-module_box__Dj2zP.Box-module_space-none__nI0HO {
  padding: 0;
}
.Box-module_box__Dj2zP.Box-module_bg-shade__roVRv {
  background-color: var(--color-background-modal-shade);
}
.Complete-module_content__-qYUl.Complete-module_content__-qYUl {
  max-width: 1000px;
  padding-top: var(--m);
  height: 100%;
  flex: 1 0 100px;
  box-shadow: none;
  background-color: transparent;
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xl);
  flex-direction: column;
  gap: var(--m);
  text-align: center;
  position: relative;
}
.Complete-module_content__-qYUl.Complete-module_content__-qYUl .Complete-module_icon__y443h {
  width: 64px;
  height: 64px;
  isolation: isolate;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.Complete-module_content__-qYUl.Complete-module_content__-qYUl .Complete-module_icon__y443h::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background-color: var(--color-green-ui);
  z-index: -1;
}
.Complete-module_content__-qYUl.Complete-module_content__-qYUl .Complete-module_icon__y443h svg {
  width: 38%;
  height: 38%;
  -o-object-fit: contain;
     object-fit: contain;
  color: var(--color-text-on-primary);
}
.Complete-module_content__-qYUl.Complete-module_content__-qYUl .Complete-module_actions__7EDpo {
  display: flex;
  gap: var(--m-l);
  align-items: center;
  justify-content: center;
  margin-top: var(--m-xxl);
}
.Complete-module_content__-qYUl.Complete-module_content__-qYUl .Complete-module_actions__7EDpo > * {
  flex: 1 0 190px;
}
.Complete-module_content__-qYUl.Complete-module_content__-qYUl .Complete-module_actions__7EDpo button {
  width: 50%;
}
.Complete-module_spinner__oocpd {
  border: 1px solid var(--color-border);
  margin-top: var(--m);
  padding: var(--m);
  border-radius: var(--border-radius-1);
}
.Default-module_table__44Sxu {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  border-radius: var(--border-radius-2);
  outline: 1px solid var(--color-border);
  table-layout: fixed;
  overflow: hidden;
}
@media (max-width: 768px) {
  .Default-module_table__44Sxu {
    font-size: 14px; /* Slightly smaller font on tablets */
  }
}
@media (max-width: 480px) {
  .Default-module_table__44Sxu {
    font-size: 12px; /* Even smaller font on mobile */
    min-width: 320px; /* Ensure minimum width to prevent excessive squeezing */
  }
}
.Default-module_table__44Sxu .Default-module_thead__QhWkw {
  display: table-header-group;
}
.Default-module_table__44Sxu .Default-module_tbody__8S-zy {
  display: block;
  overflow: auto;
  width: 100%;
}
.Default-module_table__44Sxu .Default-module_tr__esZOa {
  display: flex;
  width: 100%;
  overflow: hidden;
  flex-wrap: nowrap;
}
.Default-module_table__44Sxu .Default-module_td__iAMlt {
  display: inline-flex;
  align-items: center;
  height: 44px;
  flex-shrink: 0;
}
@media (max-width: 480px) {
  .Default-module_table__44Sxu .Default-module_td__iAMlt {
    height: 36px; /* Smaller cell height on mobile */
    padding-left: var(--m-xxs) !important;
    padding-right: var(--m-xxs) !important;
  }
}
.Default-module_table__44Sxu .Default-module_caption__VYeqs {
  display: table-caption;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-background-modal);
  padding: 0 var(--m-s);
  border-radius: var(--border-radius-2) var(--border-radius-2) 0 0;
}
.Default-module_table__44Sxu .Default-module_thead__QhWkw .Default-module_tr__esZOa .Default-module_td__iAMlt {
  font-weight: 400;
  white-space: nowrap;
  padding: var(--m-xxxs) var(--m-s);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}
.Default-module_table__44Sxu .Default-module_thead__QhWkw .Default-module_tr__esZOa .Default-module_td__iAMlt:first-of-type {
  border-radius: var(--border-radius-2) 0 0 0;
}
.Default-module_table__44Sxu .Default-module_thead__QhWkw .Default-module_tr__esZOa .Default-module_td__iAMlt:last-child {
  border-radius: 0 var(--border-radius-2) 0 0;
}
.Default-module_table__44Sxu .Default-module_tbody__8S-zy .Default-module_tr__esZOa .Default-module_td__iAMlt {
  vertical-align: middle;
  padding: var(--m-xxxs) var(--m-s);
  font-weight: 400;
}
.Default-module_table__44Sxu .Default-module_tbody__8S-zy .Default-module_tr__esZOa .Default-module_td__iAMlt > span, .Default-module_table__44Sxu .Default-module_tbody__8S-zy .Default-module_tr__esZOa .Default-module_td__iAMlt > small {
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  overflow: hidden;
}
.Default-module_table__44Sxu .Default-module_tbody__8S-zy .Default-module_tr__esZOa .Default-module_td__iAMlt.Default-module_highlight__qpgKE {
  font-weight: 500;
}
.Default-module_table__44Sxu .Default-module_tbody__8S-zy .Default-module_tr__esZOa .Default-module_td__iAMlt.Default-module_element__DzyB- {
  padding: 0 var(--m-s);
}
@media (max-width: 480px) {
  .Default-module_table__44Sxu .Default-module_tbody__8S-zy .Default-module_tr__esZOa .Default-module_td__iAMlt.Default-module_element__DzyB- {
    padding: 0 var(--m-xxs);
  }
}
.Default-module_table__44Sxu .Default-module_tbody__8S-zy .Default-module_tr__esZOa:hover {
  box-shadow: 0 0 0 2px var(--color-border);
  position: relative;
}
.Default-module_table__44Sxu .Default-module_tbody__8S-zy .Default-module_tr__esZOa:last-child {
  border-radius: 0 0 var(--border-radius-2) var(--border-radius-2);
}
.Default-module_table__44Sxu .Default-module_tbody__8S-zy .Default-module_tr__esZOa:last-child .Default-module_td__iAMlt {
  border-bottom-color: transparent;
}
.Default-module_table__44Sxu .Default-module_tbody__8S-zy .Default-module_tr__esZOa:last-child .Default-module_td__iAMlt:first-of-type {
  border-radius: 0 0 0 var(--border-radius-2);
}
.Default-module_table__44Sxu .Default-module_tbody__8S-zy .Default-module_tr__esZOa:last-child .Default-module_td__iAMlt:last-child {
  border-radius: 0 0 var(--border-radius-2) 0;
}
.Default-module_table__44Sxu.Default-module_zebra__p0PyM {
  background-color: var(--color-background-modal);
}
.Default-module_table__44Sxu.Default-module_zebra__p0PyM .Default-module_tbody__8S-zy .Default-module_tr__esZOa:nth-child(odd) .Default-module_td__iAMlt {
  background-color: var(--color-background);
}
.Default-module_table__44Sxu.Default-module_dark__TYSeO {
  background-color: var(--color-background);
}
.Default-module_table__44Sxu.Default-module_dark__TYSeO .Default-module_thead__QhWkw .Default-module_tr__esZOa .Default-module_td__iAMlt {
  background-color: var(--color-background-modal);
}
.Default-module_table__44Sxu.Default-module_light__uGaq4 {
  background-color: var(--color-background-modal);
}
.Default-module_table__44Sxu.Default-module_transparent__rzqM5 .Default-module_thead__QhWkw {
  background-color: var(--color-background-modal);
}
.Default-module_table__44Sxu.Default-module_transparent__rzqM5 .Default-module_tbody__8S-zy .Default-module_tr__esZOa:hover {
  box-shadow: none;
  position: static;
}
.Default-module_table__44Sxu.Default-module_dark__TYSeO .Default-module_tbody__8S-zy .Default-module_tr__esZOa:hover, .Default-module_table__44Sxu.Default-module_light__uGaq4 .Default-module_tbody__8S-zy .Default-module_tr__esZOa:hover {
  box-shadow: none;
  position: static;
}
.Default-module_table__44Sxu.Default-module_dark__TYSeO .Default-module_tbody__8S-zy .Default-module_tr__esZOa:first-of-type .Default-module_td__iAMlt, .Default-module_table__44Sxu.Default-module_light__uGaq4 .Default-module_tbody__8S-zy .Default-module_tr__esZOa:first-of-type .Default-module_td__iAMlt {
  padding-top: var(--m-s);
  height: calc(44px + var(--m-s) - var(--m-xxxs));
}
.Default-module_table__44Sxu.Default-module_dark__TYSeO .Default-module_tbody__8S-zy .Default-module_tr__esZOa:last-of-type .Default-module_td__iAMlt, .Default-module_table__44Sxu.Default-module_light__uGaq4 .Default-module_tbody__8S-zy .Default-module_tr__esZOa:last-of-type .Default-module_td__iAMlt {
  padding-bottom: var(--m-s);
  height: calc(44px + var(--m-s) - var(--m-xxxs));
}
.Default-module_emptyMsg__HmPC- {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 15vh;
  text-align: center;
}
.Tooltip-module_tooltip__wRW1H {
  display: inline-flex;
  align-items: center;
  gap: var(--m-xs);
}
.Tooltip-module_tooltip__wRW1H .Tooltip-module_icon__8Cb-b {
  position: relative;
  display: block;
  cursor: pointer;
}
.Tooltip-module_tooltip__wRW1H.Tooltip-module_multiline__E-a-0 .Tooltip-module_message__dXk82 {
  width: 260px;
  white-space: normal;
}
.Tooltip-module_message__dXk82 {
  position: absolute;
  transform: translateX(-50%);
  background-color: var(--color-background-modal);
  z-index: 3;
  padding: var(--m-xxs) var(--m-xs);
  border-radius: var(--border-radius);
  margin-top: var(--m-xs);
  box-shadow: 0 0 0 1px var(--color-border), 0 5px 15px rgba(0, 0, 0, 0.2);
  max-width: 300px;
}
.Tooltip-module_message__dXk82::after, .Tooltip-module_message__dXk82::before {
  position: absolute;
  top: calc(var(--m-xxxs) * 1.732 * -1);
  left: 50%;
  border-left: var(--m-xxxs) solid transparent;
  border-right: var(--m-xxxs) solid transparent;
  border-bottom: calc(var(--m-xxxs) * 1.732) solid var(--color-border);
  content: "";
  font-size: 0;
  line-height: 0;
  width: 0;
  transform: translateX(-50%);
}
.Tooltip-module_message__dXk82::after {
  top: calc(var(--m-xxxs) * 1.732 * -1 + 2px);
  border-bottom: calc(var(--m-xxxs) * 1.732) solid var(--color-background-modal);
}
.Checkbox-module_container__509B2 {
  display: inline-block;
  gap: var(--m-xs);
  align-items: center;
}
.Checkbox-module_container__509B2:has(input:not(:disabled)) {
  cursor: pointer;
}
.Checkbox-module_container__509B2 input[type=checkbox] {
  -webkit-appearance: none;
  -moz-appearance: none;
       appearance: none;
  background-color: transparent;
  margin: 0;
  color: var(--color-primary);
  width: var(--m);
  height: var(--m);
  border: 2px solid var(--color-border);
  display: grid;
  place-content: center;
  border-radius: var(--border-radius-1);
  cursor: pointer;
}
.Checkbox-module_container__509B2 input[type=checkbox]::before {
  content: "";
  width: var(--m-xs);
  height: var(--m-xs);
}
.Checkbox-module_container__509B2 input[type=checkbox]:checked {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}
.Checkbox-module_container__509B2 input[type=checkbox]:checked::before {
  clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
  box-shadow: inset 1em 1em var(--color-text-on-primary);
}
.Checkbox-module_container__509B2 input[type=checkbox]:not(:disabled):focus-visible {
  outline: 1px solid var(--color-border);
  outline-offset: 3px;
}
.Checkbox-module_container__509B2 input[type=checkbox]:disabled {
  --container-color: var(--container-disabled);
  color: var(--container-disabled);
  cursor: default;
  background-color: var(--color-input-disabled);
  border-color: var(--color-border-soft);
}
.Checkbox-module_container__509B2 input[type=checkbox]:disabled:checked::before {
  clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
  box-shadow: inset 1em 1em var(--color-border-soft);
}
.MapColumns-module_content__cwn9D {
  height: 100%;
  width: 100%;
}
.MapColumns-module_content__cwn9D form {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 1rem;
}
.MapColumns-module_content__cwn9D form .MapColumns-module_tableWrapper__rJkZT {
  display: flex;
  max-height: 400px;
  overflow-y: auto;
  overflow-x: auto;
  padding: 1px;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
}
.MapColumns-module_content__cwn9D form .MapColumns-module_actions__qteVr {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--m-xs);
}
@media (max-width: 480px) {
  .MapColumns-module_content__cwn9D form .MapColumns-module_actions__qteVr {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
.MapColumns-module_samples__HDiqx {
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
  white-space: nowrap;
}
@media (max-width: 768px) {
  .MapColumns-module_samples__HDiqx {
    max-width: 100%;
  }
}
.MapColumns-module_samples__HDiqx > small {
  background-color: var(--color-input-background);
  font-family: monospace;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  display: inline-block;
}
@media (max-width: 480px) {
  .MapColumns-module_samples__HDiqx > small {
    font-size: 10px;
    max-width: 90px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
.MapColumns-module_samples__HDiqx > small + small {
  margin-left: 0.25rem;
}
.MapColumns-module_spinner__aIjhF {
  border: 1px solid var(--color-border);
  margin-top: var(--m);
  padding: var(--m);
  border-radius: var(--border-radius-1);
}
.MapColumns-module_errorContainer__UrQy6 {
  display: flex;
  justify-content: center;
  max-width: 60vw;
}
@media (max-width: 768px) {
  .MapColumns-module_errorContainer__UrQy6 {
    max-width: 100%;
  }
}
.MapColumns-module_schemalessTextInput__yeNez {
  width: 210px;
}
@media (max-width: 480px) {
  .MapColumns-module_schemalessTextInput__yeNez {
    width: 100%;
  }
}
.RowSelection-module_content__ZpzFE {
  flex-grow: 1;
  height: 100%;
}
.RowSelection-module_content__ZpzFE form {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--m);
}
.RowSelection-module_content__ZpzFE form .RowSelection-module_tableWrapper__j0vPf {
  display: flex;
  overflow-y: auto;
  padding: 1px;
  margin-right: -20px;
  padding-right: 21px;
  max-height: 400px;
}
.RowSelection-module_content__ZpzFE form .RowSelection-module_actions__xQYmq {
  display: flex;
  justify-content: space-between;
}
.RowSelection-module_samples__MoNwo {
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1;
  white-space: nowrap;
}
.RowSelection-module_samples__MoNwo > small {
  background-color: var(--color-input-background);
  font-family: monospace;
  padding: var(--m-xxxxs);
  border-radius: var(--border-radius-1);
  font-size: var(--font-size-xs);
  display: inline-block;
}
.RowSelection-module_samples__MoNwo > small + small {
  margin-left: var(--m-xxxxs);
}
.RowSelection-module_spinner__Ytadw {
  border: 1px solid var(--color-border);
  margin-top: var(--m);
  padding: var(--m);
  border-radius: var(--border-radius-1);
}
.RowSelection-module_inputRadio__LYh-- {
  margin-right: 10px;
}
.RowSelection-module_headingCaption__rpHA3 {
  padding: 12px 0 10px 0;
  color: var(--color-text-secondary);
  font-weight: 400;
  height: 48px;
  vertical-align: middle;
  text-align: center;
}
.RowSelection-module_headingCaption__rpHA3 span > span:nth-child(1) > span {
  font-weight: 400;
}
.RowSelection-module_warningIcon__QeTyR {
  margin-right: 7px;
}
.ConfigureImport-module_baseContainer__q8h4Q, .ConfigureImport-module_configureImport__LEOsk, .ConfigureImport-module_flexContainer__HbOJk {
  width: 100%;
  max-width: 100%;
  padding: 1.5rem;
}
@media (max-width: 768px) {
  .ConfigureImport-module_baseContainer__q8h4Q, .ConfigureImport-module_configureImport__LEOsk, .ConfigureImport-module_flexContainer__HbOJk {
    padding: 1rem;
  }
}
@media (max-width: 640px) {
  .ConfigureImport-module_baseContainer__q8h4Q, .ConfigureImport-module_configureImport__LEOsk, .ConfigureImport-module_flexContainer__HbOJk {
    padding: 0.75rem;
  }
}
.ConfigureImport-module_flexContainer__HbOJk {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}
.ConfigureImport-module_scrollableContent__njXa7 {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: visible;
  max-width: 100%;
  min-width: 0;
}
.ConfigureImport-module_tableContainer__mMlmj {
  flex: 1;
  overflow-x: auto;
  overflow-y: auto;
  max-width: 100%;
  -webkit-overflow-scrolling: touch;
}
.ConfigureImport-module_tableContainer__mMlmj table {
  min-width: 100%;
  width: -moz-max-content;
  width: max-content;
}
.ConfigureImport-module_headerSection__ZgAQT {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}
.ConfigureImport-module_headerSection__ZgAQT h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}
.ConfigureImport-module_headerSection__ZgAQT p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}
.ConfigureImport-module_toolbar__GEhEX {
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
.ConfigureImport-module_configureImport__LEOsk {
  height: 100%;
  margin: 0;
}
.Uploader-module_modernContent__XjUvk {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
@media (max-width: 640px) {
  .Uploader-module_modernContent__XjUvk {
    padding: 1.5rem 1rem;
  }
}
@media (max-width: 480px) {
  .Uploader-module_modernContent__XjUvk {
    padding: 1rem;
  }
}
.Uploader-module_content__jHvJS {
  display: flex;
  gap: var(--m);
  height: auto;
  min-height: 200px;
}
@media (max-width: 480px) {
  .Uploader-module_content__jHvJS {
    flex-direction: column;
  }
}
.Uploader-module_content__jHvJS > *:first-child {
  flex: 1 1 500px;
  overflow: hidden;
}
.Uploader-module_content__jHvJS > *:last-child {
  flex-basis: 38%;
}
@media (max-width: 480px) {
  .Uploader-module_content__jHvJS > *:last-child {
    display: none;
  }
}
.Uploader-module_box__kUUB9 {
  display: flex;
  flex-direction: column;
  gap: var(--m-s);
  max-height: 200px;
}
.Uploader-module_tableContainer__sOrWe {
  overflow: hidden;
  overflow-y: auto;
  max-height: 150px;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-2);
}
.Uploader-module_tableContainer__sOrWe > div {
  outline: none;
}
.Uploader-module_tableContainer__sOrWe .Uploader-module_tbody__A0Trr {
  overflow: auto;
}
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

.container{
    width: 100%;
}

@media (min-width: 640px){

    .container{
        max-width: 640px;
    }
}

@media (min-width: 768px){

    .container{
        max-width: 768px;
    }
}

@media (min-width: 1024px){

    .container{
        max-width: 1024px;
    }
}

@media (min-width: 1280px){

    .container{
        max-width: 1280px;
    }
}

@media (min-width: 1536px){

    .container{
        max-width: 1536px;
    }
}

.csv-importer {
    /* Modern Color Scheme - Light Mode */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;

    --radius: 0.5rem;

    /* Legacy color variables for compatibility */
    --color-primary: #2563eb;
    --color-primary-foreground: #ffffff;
    --color-secondary: #f3f4f6;
    --color-secondary-foreground: #111827;
    --color-border: #e5e7eb;
    --color-background: #ffffff;
    --color-text: #111827;
    --color-error: #ef4444;
    --color-error-foreground: #ffffff;
    --color-muted: #f3f4f6;
    --color-muted-foreground: #6b7280;
    --color-accent: #f3f4f6;
    --color-accent-foreground: #111827;
  }

.csv-importer[data-theme="dark"] {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }

.sr-only{
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
}

.pointer-events-none{
    pointer-events: none;
}

.pointer-events-auto{
    pointer-events: auto;
}

.visible{
    visibility: visible;
}

.collapse{
    visibility: collapse;
}

.static{
    position: static;
}

.fixed{
    position: fixed;
}

.absolute{
    position: absolute;
}

.relative{
    position: relative;
}

.sticky{
    position: sticky;
}

.inset-0{
    inset: 0px;
}

.bottom-0{
    bottom: 0px;
}

.left-0{
    left: 0px;
}

.left-2{
    left: 0.5rem;
}

.left-4{
    left: 1rem;
}

.left-\[50\%\]{
    left: 50%;
}

.right-0{
    right: 0px;
}

.right-2{
    right: 0.5rem;
}

.right-4{
    right: 1rem;
}

.top-0{
    top: 0px;
}

.top-1{
    top: 0.25rem;
}

.top-1\/2{
    top: 50%;
}

.top-2{
    top: 0.5rem;
}

.top-4{
    top: 1rem;
}

.top-\[50\%\]{
    top: 50%;
}

.top-auto{
    top: auto;
}

.isolate{
    isolation: isolate;
}

.z-10{
    z-index: 10;
}

.z-50{
    z-index: 50;
}

.z-\[1000\]{
    z-index: 1000;
}

.z-\[100\]{
    z-index: 100;
}

.-mx-1{
    margin-left: -0.25rem;
    margin-right: -0.25rem;
}

.my-1{
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
}

.-ml-1{
    margin-left: -0.25rem;
}

.mb-1{
    margin-bottom: 0.25rem;
}

.mb-2{
    margin-bottom: 0.5rem;
}

.mb-3{
    margin-bottom: 0.75rem;
}

.mb-4{
    margin-bottom: 1rem;
}

.mb-6{
    margin-bottom: 1.5rem;
}

.ml-1{
    margin-left: 0.25rem;
}

.ml-2{
    margin-left: 0.5rem;
}

.mr-2{
    margin-right: 0.5rem;
}

.mt-1{
    margin-top: 0.25rem;
}

.mt-2{
    margin-top: 0.5rem;
}

.mt-6{
    margin-top: 1.5rem;
}

.line-clamp-1{
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
}

.block{
    display: block;
}

.inline-block{
    display: inline-block;
}

.inline{
    display: inline;
}

.flex{
    display: flex;
}

.inline-flex{
    display: inline-flex;
}

.table{
    display: table;
}

.grid{
    display: grid;
}

.hidden{
    display: none;
}

.h-10{
    height: 2.5rem;
}

.h-12{
    height: 3rem;
}

.h-3{
    height: 0.75rem;
}

.h-3\.5{
    height: 0.875rem;
}

.h-4{
    height: 1rem;
}

.h-5{
    height: 1.25rem;
}

.h-6{
    height: 1.5rem;
}

.h-8{
    height: 2rem;
}

.h-9{
    height: 2.25rem;
}

.h-\[var\(--radix-select-trigger-height\)\]{
    height: var(--radix-select-trigger-height);
}

.h-full{
    height: 100%;
}

.h-px{
    height: 1px;
}

.max-h-96{
    max-height: 24rem;
}

.max-h-\[120px\]{
    max-height: 120px;
}

.max-h-\[300px\]{
    max-height: 300px;
}

.max-h-screen{
    max-height: 100vh;
}

.min-h-\[180px\]{
    min-height: 180px;
}

.min-h-\[240px\]{
    min-height: 240px;
}

.w-10{
    width: 2.5rem;
}

.w-11{
    width: 2.75rem;
}

.w-3{
    width: 0.75rem;
}

.w-3\.5{
    width: 0.875rem;
}

.w-4{
    width: 1rem;
}

.w-5{
    width: 1.25rem;
}

.w-8{
    width: 2rem;
}

.w-\[30\%\]{
    width: 30%;
}

.w-\[35\%\]{
    width: 35%;
}

.w-full{
    width: 100%;
}

.min-w-\[600px\]{
    min-width: 600px;
}

.min-w-\[8rem\]{
    min-width: 8rem;
}

.min-w-\[var\(--radix-select-trigger-width\)\]{
    min-width: var(--radix-select-trigger-width);
}

.max-w-\[250px\]{
    max-width: 250px;
}

.max-w-\[300px\]{
    max-width: 300px;
}

.max-w-\[800px\]{
    max-width: 800px;
}

.max-w-lg{
    max-width: 32rem;
}

.max-w-md{
    max-width: 28rem;
}

.flex-1{
    flex: 1 1 0%;
}

.flex-shrink{
    flex-shrink: 1;
}

.flex-shrink-0{
    flex-shrink: 0;
}

.shrink-0{
    flex-shrink: 0;
}

.flex-grow{
    flex-grow: 1;
}

.border-collapse{
    border-collapse: collapse;
}

.-translate-y-1{
    --tw-translate-y: -0.25rem;
    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.-translate-y-1\/2{
    --tw-translate-y: -50%;
    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.translate-x-0{
    --tw-translate-x: 0px;
    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.translate-x-5{
    --tw-translate-x: 1.25rem;
    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.translate-x-\[-50\%\]{
    --tw-translate-x: -50%;
    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.translate-y-\[-50\%\]{
    --tw-translate-y: -50%;
    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.transform{
    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

@keyframes spin{

    to{
        transform: rotate(360deg);
    }
}

.animate-spin{
    animation: spin 1s linear infinite;
}

.cursor-default{
    cursor: default;
}

.cursor-pointer{
    cursor: pointer;
}

.select-none{
    -webkit-user-select: none;
       -moz-user-select: none;
            user-select: none;
}

.resize{
    resize: both;
}

.flex-row{
    flex-direction: row;
}

.flex-row-reverse{
    flex-direction: row-reverse;
}

.flex-col{
    flex-direction: column;
}

.flex-col-reverse{
    flex-direction: column-reverse;
}

.flex-wrap{
    flex-wrap: wrap;
}

.items-start{
    align-items: flex-start;
}

.items-end{
    align-items: flex-end;
}

.items-center{
    align-items: center;
}

.items-baseline{
    align-items: baseline;
}

.items-stretch{
    align-items: stretch;
}

.justify-start{
    justify-content: flex-start;
}

.justify-end{
    justify-content: flex-end;
}

.justify-center{
    justify-content: center;
}

.justify-between{
    justify-content: space-between;
}

.justify-around{
    justify-content: space-around;
}

.justify-evenly{
    justify-content: space-evenly;
}

.gap-1{
    gap: 0.25rem;
}

.gap-1\.5{
    gap: 0.375rem;
}

.gap-2{
    gap: 0.5rem;
}

.gap-3{
    gap: 0.75rem;
}

.gap-4{
    gap: 1rem;
}

.gap-6{
    gap: 1.5rem;
}

.space-x-2 > :not([hidden]) ~ :not([hidden]){
    --tw-space-x-reverse: 0;
    margin-right: calc(0.5rem * var(--tw-space-x-reverse));
    margin-left: calc(0.5rem * calc(1 - var(--tw-space-x-reverse)));
}

.space-x-4 > :not([hidden]) ~ :not([hidden]){
    --tw-space-x-reverse: 0;
    margin-right: calc(1rem * var(--tw-space-x-reverse));
    margin-left: calc(1rem * calc(1 - var(--tw-space-x-reverse)));
}

.space-y-0 > :not([hidden]) ~ :not([hidden]){
    --tw-space-y-reverse: 0;
    margin-top: calc(0px * calc(1 - var(--tw-space-y-reverse)));
    margin-bottom: calc(0px * var(--tw-space-y-reverse));
}

.space-y-1 > :not([hidden]) ~ :not([hidden]){
    --tw-space-y-reverse: 0;
    margin-top: calc(0.25rem * calc(1 - var(--tw-space-y-reverse)));
    margin-bottom: calc(0.25rem * var(--tw-space-y-reverse));
}

.space-y-1\.5 > :not([hidden]) ~ :not([hidden]){
    --tw-space-y-reverse: 0;
    margin-top: calc(0.375rem * calc(1 - var(--tw-space-y-reverse)));
    margin-bottom: calc(0.375rem * var(--tw-space-y-reverse));
}

.space-y-2 > :not([hidden]) ~ :not([hidden]){
    --tw-space-y-reverse: 0;
    margin-top: calc(0.5rem * calc(1 - var(--tw-space-y-reverse)));
    margin-bottom: calc(0.5rem * var(--tw-space-y-reverse));
}

.space-y-4 > :not([hidden]) ~ :not([hidden]){
    --tw-space-y-reverse: 0;
    margin-top: calc(1rem * calc(1 - var(--tw-space-y-reverse)));
    margin-bottom: calc(1rem * var(--tw-space-y-reverse));
}

.overflow-auto{
    overflow: auto;
}

.overflow-hidden{
    overflow: hidden;
}

.overflow-x-auto{
    overflow-x: auto;
}

.overflow-y-auto{
    overflow-y: auto;
}

.truncate{
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.whitespace-nowrap{
    white-space: nowrap;
}

.rounded{
    border-radius: 0.25rem;
}

.rounded-full{
    border-radius: 9999px;
}

.rounded-lg{
    border-radius: var(--radius);
}

.rounded-md{
    border-radius: calc(var(--radius) - 2px);
}

.rounded-sm{
    border-radius: calc(var(--radius) - 4px);
}

.border{
    border-width: 1px;
}

.border-2{
    border-width: 2px;
}

.border-b{
    border-bottom-width: 1px;
}

.border-b-2{
    border-bottom-width: 2px;
}

.border-l-4{
    border-left-width: 4px;
}

.border-r{
    border-right-width: 1px;
}

.border-t{
    border-top-width: 1px;
}

.border-dashed{
    border-style: dashed;
}

.border-none{
    border-style: none;
}

.border-blue-200{
    --tw-border-opacity: 1;
    border-color: rgb(191 219 254 / var(--tw-border-opacity, 1));
}

.border-blue-500{
    --tw-border-opacity: 1;
    border-color: rgb(59 130 246 / var(--tw-border-opacity, 1));
}

.border-destructive{
    border-color: hsl(var(--destructive));
}

.border-destructive\/50{
    border-color: hsl(var(--destructive) / 0.5);
}

.border-gray-100{
    --tw-border-opacity: 1;
    border-color: rgb(243 244 246 / var(--tw-border-opacity, 1));
}

.border-gray-200{
    --tw-border-opacity: 1;
    border-color: rgb(229 231 235 / var(--tw-border-opacity, 1));
}

.border-gray-300{
    --tw-border-opacity: 1;
    border-color: rgb(209 213 219 / var(--tw-border-opacity, 1));
}

.border-input{
    border-color: hsl(var(--input));
}

.border-muted{
    border-color: hsl(var(--muted));
}

.border-orange-500{
    --tw-border-opacity: 1;
    border-color: rgb(249 115 22 / var(--tw-border-opacity, 1));
}

.border-primary{
    border-color: hsl(var(--primary));
}

.border-red-200{
    --tw-border-opacity: 1;
    border-color: rgb(254 202 202 / var(--tw-border-opacity, 1));
}

.border-red-500{
    --tw-border-opacity: 1;
    border-color: rgb(239 68 68 / var(--tw-border-opacity, 1));
}

.border-transparent{
    border-color: transparent;
}

.bg-background{
    background-color: hsl(var(--background));
}

.bg-black{
    --tw-bg-opacity: 1;
    background-color: rgb(0 0 0 / var(--tw-bg-opacity, 1));
}

.bg-black\/80{
    background-color: rgb(0 0 0 / 0.8);
}

.bg-blue-50{
    --tw-bg-opacity: 1;
    background-color: rgb(239 246 255 / var(--tw-bg-opacity, 1));
}

.bg-blue-600{
    --tw-bg-opacity: 1;
    background-color: rgb(37 99 235 / var(--tw-bg-opacity, 1));
}

.bg-card{
    background-color: hsl(var(--card));
}

.bg-destructive{
    background-color: hsl(var(--destructive));
}

.bg-gray-100{
    --tw-bg-opacity: 1;
    background-color: rgb(243 244 246 / var(--tw-bg-opacity, 1));
}

.bg-gray-200{
    --tw-bg-opacity: 1;
    background-color: rgb(229 231 235 / var(--tw-bg-opacity, 1));
}

.bg-gray-50{
    --tw-bg-opacity: 1;
    background-color: rgb(249 250 251 / var(--tw-bg-opacity, 1));
}

.bg-input{
    background-color: hsl(var(--input));
}

.bg-muted{
    background-color: hsl(var(--muted));
}

.bg-orange-50{
    --tw-bg-opacity: 1;
    background-color: rgb(255 247 237 / var(--tw-bg-opacity, 1));
}

.bg-popover{
    background-color: hsl(var(--popover));
}

.bg-primary{
    background-color: hsl(var(--primary));
}

.bg-red-50{
    --tw-bg-opacity: 1;
    background-color: rgb(254 242 242 / var(--tw-bg-opacity, 1));
}

.bg-red-600{
    --tw-bg-opacity: 1;
    background-color: rgb(220 38 38 / var(--tw-bg-opacity, 1));
}

.bg-transparent{
    background-color: transparent;
}

.bg-white{
    --tw-bg-opacity: 1;
    background-color: rgb(255 255 255 / var(--tw-bg-opacity, 1));
}

.p-0{
    padding: 0px;
}

.p-1{
    padding: 0.25rem;
}

.p-2{
    padding: 0.5rem;
}

.p-3{
    padding: 0.75rem;
}

.p-4{
    padding: 1rem;
}

.p-6{
    padding: 1.5rem;
}

.p-8{
    padding: 2rem;
}

.px-2{
    padding-left: 0.5rem;
    padding-right: 0.5rem;
}

.px-3{
    padding-left: 0.75rem;
    padding-right: 0.75rem;
}

.px-4{
    padding-left: 1rem;
    padding-right: 1rem;
}

.px-6{
    padding-left: 1.5rem;
    padding-right: 1.5rem;
}

.px-8{
    padding-left: 2rem;
    padding-right: 2rem;
}

.py-1{
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
}

.py-1\.5{
    padding-top: 0.375rem;
    padding-bottom: 0.375rem;
}

.py-10{
    padding-top: 2.5rem;
    padding-bottom: 2.5rem;
}

.py-2{
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
}

.py-3{
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
}

.py-4{
    padding-top: 1rem;
    padding-bottom: 1rem;
}

.py-8{
    padding-top: 2rem;
    padding-bottom: 2rem;
}

.pl-7{
    padding-left: 1.75rem;
}

.pl-8{
    padding-left: 2rem;
}

.pr-2{
    padding-right: 0.5rem;
}

.pr-8{
    padding-right: 2rem;
}

.pt-0{
    padding-top: 0px;
}

.pt-4{
    padding-top: 1rem;
}

.pt-6{
    padding-top: 1.5rem;
}

.text-left{
    text-align: left;
}

.text-center{
    text-align: center;
}

.text-2xl{
    font-size: 1.5rem;
    line-height: 2rem;
}

.text-base{
    font-size: 1rem;
    line-height: 1.5rem;
}

.text-lg{
    font-size: 1.125rem;
    line-height: 1.75rem;
}

.text-sm{
    font-size: 0.875rem;
    line-height: 1.25rem;
}

.text-xs{
    font-size: 0.75rem;
    line-height: 1rem;
}

.font-bold{
    font-weight: 700;
}

.font-medium{
    font-weight: 500;
}

.font-semibold{
    font-weight: 600;
}

.uppercase{
    text-transform: uppercase;
}

.lowercase{
    text-transform: lowercase;
}

.leading-none{
    line-height: 1;
}

.leading-relaxed{
    line-height: 1.625;
}

.tracking-tight{
    letter-spacing: -0.025em;
}

.text-blue-600{
    --tw-text-opacity: 1;
    color: rgb(37 99 235 / var(--tw-text-opacity, 1));
}

.text-card-foreground{
    color: hsl(var(--card-foreground));
}

.text-current{
    color: currentColor;
}

.text-destructive{
    color: hsl(var(--destructive));
}

.text-destructive-foreground{
    color: hsl(var(--destructive-foreground));
}

.text-foreground{
    color: hsl(var(--foreground));
}

.text-foreground\/50{
    color: hsl(var(--foreground) / 0.5);
}

.text-gray-400{
    --tw-text-opacity: 1;
    color: rgb(156 163 175 / var(--tw-text-opacity, 1));
}

.text-gray-500{
    --tw-text-opacity: 1;
    color: rgb(107 114 128 / var(--tw-text-opacity, 1));
}

.text-gray-600{
    --tw-text-opacity: 1;
    color: rgb(75 85 99 / var(--tw-text-opacity, 1));
}

.text-gray-700{
    --tw-text-opacity: 1;
    color: rgb(55 65 81 / var(--tw-text-opacity, 1));
}

.text-gray-900{
    --tw-text-opacity: 1;
    color: rgb(17 24 39 / var(--tw-text-opacity, 1));
}

.text-green-500{
    --tw-text-opacity: 1;
    color: rgb(34 197 94 / var(--tw-text-opacity, 1));
}

.text-green-600{
    --tw-text-opacity: 1;
    color: rgb(22 163 74 / var(--tw-text-opacity, 1));
}

.text-muted-foreground{
    color: hsl(var(--muted-foreground));
}

.text-popover-foreground{
    color: hsl(var(--popover-foreground));
}

.text-red-300{
    --tw-text-opacity: 1;
    color: rgb(252 165 165 / var(--tw-text-opacity, 1));
}

.text-red-500{
    --tw-text-opacity: 1;
    color: rgb(239 68 68 / var(--tw-text-opacity, 1));
}

.text-red-700{
    --tw-text-opacity: 1;
    color: rgb(185 28 28 / var(--tw-text-opacity, 1));
}

.text-white{
    --tw-text-opacity: 1;
    color: rgb(255 255 255 / var(--tw-text-opacity, 1));
}

.underline{
    text-decoration-line: underline;
}

.line-through{
    text-decoration-line: line-through;
}

.underline-offset-4{
    text-underline-offset: 4px;
}

.antialiased{
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

.opacity-0{
    opacity: 0;
}

.opacity-100{
    opacity: 1;
}

.opacity-25{
    opacity: 0.25;
}

.opacity-30{
    opacity: 0.3;
}

.opacity-70{
    opacity: 0.7;
}

.opacity-75{
    opacity: 0.75;
}

.opacity-90{
    opacity: 0.9;
}

.shadow{
    --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
    box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}

.shadow-lg{
    --tw-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color);
    box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}

.shadow-md{
    --tw-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --tw-shadow-colored: 0 4px 6px -1px var(--tw-shadow-color), 0 2px 4px -2px var(--tw-shadow-color);
    box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}

.shadow-sm{
    --tw-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --tw-shadow-colored: 0 1px 2px 0 var(--tw-shadow-color);
    box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}

.outline-none{
    outline: 2px solid transparent;
    outline-offset: 2px;
}

.outline{
    outline-style: solid;
}

.ring-0{
    --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
    --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color);
    box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}

.ring-ring{
    --tw-ring-color: hsl(var(--ring));
}

.ring-offset-background{
    --tw-ring-offset-color: hsl(var(--background));
}

.drop-shadow{
    --tw-drop-shadow: drop-shadow(0 1px 2px rgb(0 0 0 / 0.1)) drop-shadow(0 1px 1px rgb(0 0 0 / 0.06));
    filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
}

.grayscale{
    --tw-grayscale: grayscale(100%);
    filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
}

.filter{
    filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
}

.transition{
    transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-backdrop-filter;
    transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
    transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-backdrop-filter;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
}

.transition-all{
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
}

.transition-colors{
    transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
}

.transition-opacity{
    transition-property: opacity;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
}

.transition-transform{
    transition-property: transform;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
}

.duration-200{
    transition-duration: 200ms;
}

/* Chrome, Safari and Opera */

.animate-in {
    animation-duration: 0.3s;
    animation-fill-mode: both;
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }

.fade-in-0 {
    animation-name: fadeIn;
  }

.zoom-in-95 {
    animation-name: zoomIn;
  }

@keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

@keyframes zoomIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

/* Modern scrollbar styling */

/* Animation classes */

/* Unique marker to identify this library's CSS when transferring to iframe */

.importcsv-css-marker { /* do not remove */ }

/* Legacy styles for compatibility */

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

@media (max-width: 768px) {

.app-container {
    padding: 15px
}
  }

@media (max-width: 480px) {

.app-container {
    padding: 10px
}
  }

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
}

@media (max-width: 768px) {

.app-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px
}
  }

.app-header h1 {
  margin: 0;
  color: #333;
}

@media (max-width: 480px) {

.app-header h1 {
    font-size: 1.5rem
}
  }

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

@media (max-width: 480px) {

.user-info {
    gap: 10px;
    flex-wrap: wrap
}
  }

.app-main {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {

.app-main {
    padding: 15px
}
  }

@media (max-width: 480px) {

.app-main {
    padding: 10px;
    border-radius: 6px
}
  }

.schema-selector {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

@media (max-width: 768px) {

.schema-selector {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px
}
  }

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

@media (max-width: 480px) {

.error-message {
    padding: 8px 12px;
    font-size: 14px
}
  }

.import-job-status {
  margin-top: 20px;
  padding: 15px;
  background-color: #e8f5e9;
  border-radius: 4px;
}

@media (max-width: 480px) {

.import-job-status {
    padding: 10px
}
  }

.login-container {
  max-width: 400px;
  margin: 100px auto;
  padding: 30px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {

.login-container {
    max-width: 85%;
    margin: 60px auto;
    padding: 20px
}
  }

@media (max-width: 480px) {

.login-container {
    max-width: 95%;
    margin: 30px auto;
    padding: 15px
}
  }

.login-container h2 {
  margin-top: 0;
  margin-bottom: 20px;
  text-align: center;
  color: #333;
}

@media (max-width: 480px) {

.login-container h2 {
    font-size: 1.5rem;
    margin-bottom: 15px
}
  }

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ccc;
  box-sizing: border-box;
}

.file\:border-0::file-selector-button{
    border-width: 0px;
}

.file\:bg-transparent::file-selector-button{
    background-color: transparent;
}

.file\:text-sm::file-selector-button{
    font-size: 0.875rem;
    line-height: 1.25rem;
}

.file\:font-medium::file-selector-button{
    font-weight: 500;
}

.placeholder\:text-gray-500::-moz-placeholder{
    --tw-text-opacity: 1;
    color: rgb(107 114 128 / var(--tw-text-opacity, 1));
}

.placeholder\:text-gray-500::placeholder{
    --tw-text-opacity: 1;
    color: rgb(107 114 128 / var(--tw-text-opacity, 1));
}

.placeholder\:text-muted-foreground::-moz-placeholder{
    color: hsl(var(--muted-foreground));
}

.placeholder\:text-muted-foreground::placeholder{
    color: hsl(var(--muted-foreground));
}

.hover\:border-gray-400:hover{
    --tw-border-opacity: 1;
    border-color: rgb(156 163 175 / var(--tw-border-opacity, 1));
}

.hover\:bg-blue-100:hover{
    --tw-bg-opacity: 1;
    background-color: rgb(219 234 254 / var(--tw-bg-opacity, 1));
}

.hover\:bg-blue-700:hover{
    --tw-bg-opacity: 1;
    background-color: rgb(29 78 216 / var(--tw-bg-opacity, 1));
}

.hover\:bg-gray-100:hover{
    --tw-bg-opacity: 1;
    background-color: rgb(243 244 246 / var(--tw-bg-opacity, 1));
}

.hover\:bg-gray-200:hover{
    --tw-bg-opacity: 1;
    background-color: rgb(229 231 235 / var(--tw-bg-opacity, 1));
}

.hover\:bg-gray-50:hover{
    --tw-bg-opacity: 1;
    background-color: rgb(249 250 251 / var(--tw-bg-opacity, 1));
}

.hover\:bg-red-100:hover{
    --tw-bg-opacity: 1;
    background-color: rgb(254 226 226 / var(--tw-bg-opacity, 1));
}

.hover\:bg-red-700:hover{
    --tw-bg-opacity: 1;
    background-color: rgb(185 28 28 / var(--tw-bg-opacity, 1));
}

.hover\:bg-secondary:hover{
    background-color: hsl(var(--secondary));
}

.hover\:text-blue-700:hover{
    --tw-text-opacity: 1;
    color: rgb(29 78 216 / var(--tw-text-opacity, 1));
}

.hover\:text-blue-900:hover{
    --tw-text-opacity: 1;
    color: rgb(30 58 138 / var(--tw-text-opacity, 1));
}

.hover\:text-foreground:hover{
    color: hsl(var(--foreground));
}

.hover\:text-gray-900:hover{
    --tw-text-opacity: 1;
    color: rgb(17 24 39 / var(--tw-text-opacity, 1));
}

.hover\:underline:hover{
    text-decoration-line: underline;
}

.hover\:opacity-100:hover{
    opacity: 1;
}

.focus\:border-blue-500:focus{
    --tw-border-opacity: 1;
    border-color: rgb(59 130 246 / var(--tw-border-opacity, 1));
}

.focus\:bg-blue-100:focus{
    --tw-bg-opacity: 1;
    background-color: rgb(219 234 254 / var(--tw-bg-opacity, 1));
}

.focus\:bg-white:focus{
    --tw-bg-opacity: 1;
    background-color: rgb(255 255 255 / var(--tw-bg-opacity, 1));
}

.focus\:text-blue-900:focus{
    --tw-text-opacity: 1;
    color: rgb(30 58 138 / var(--tw-text-opacity, 1));
}

.focus\:opacity-100:focus{
    opacity: 1;
}

.focus\:outline-none:focus{
    outline: 2px solid transparent;
    outline-offset: 2px;
}

.focus\:ring-0:focus{
    --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
    --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color);
    box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}

.focus\:ring-2:focus{
    --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
    --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
    box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}

.focus\:ring-blue-500:focus{
    --tw-ring-opacity: 1;
    --tw-ring-color: rgb(59 130 246 / var(--tw-ring-opacity, 1));
}

.focus\:ring-ring:focus{
    --tw-ring-color: hsl(var(--ring));
}

.focus\:ring-offset-2:focus{
    --tw-ring-offset-width: 2px;
}

.focus-visible\:outline-none:focus-visible{
    outline: 2px solid transparent;
    outline-offset: 2px;
}

.focus-visible\:ring-2:focus-visible{
    --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
    --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
    box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}

.focus-visible\:ring-blue-500:focus-visible{
    --tw-ring-opacity: 1;
    --tw-ring-color: rgb(59 130 246 / var(--tw-ring-opacity, 1));
}

.focus-visible\:ring-gray-500:focus-visible{
    --tw-ring-opacity: 1;
    --tw-ring-color: rgb(107 114 128 / var(--tw-ring-opacity, 1));
}

.focus-visible\:ring-red-500:focus-visible{
    --tw-ring-opacity: 1;
    --tw-ring-color: rgb(239 68 68 / var(--tw-ring-opacity, 1));
}

.focus-visible\:ring-ring:focus-visible{
    --tw-ring-color: hsl(var(--ring));
}

.focus-visible\:ring-offset-2:focus-visible{
    --tw-ring-offset-width: 2px;
}

.focus-visible\:ring-offset-background:focus-visible{
    --tw-ring-offset-color: hsl(var(--background));
}

.disabled\:pointer-events-none:disabled{
    pointer-events: none;
}

.disabled\:cursor-not-allowed:disabled{
    cursor: not-allowed;
}

.disabled\:bg-gray-50:disabled{
    --tw-bg-opacity: 1;
    background-color: rgb(249 250 251 / var(--tw-bg-opacity, 1));
}

.disabled\:opacity-50:disabled{
    opacity: 0.5;
}

.group:hover .group-hover\:opacity-100{
    opacity: 1;
}

.group.destructive .group-\[\.destructive\]\:border-muted\/40{
    border-color: hsl(var(--muted) / 0.4);
}

.group.destructive .group-\[\.destructive\]\:text-red-300{
    --tw-text-opacity: 1;
    color: rgb(252 165 165 / var(--tw-text-opacity, 1));
}

.group.destructive .group-\[\.destructive\]\:hover\:border-destructive\/30:hover{
    border-color: hsl(var(--destructive) / 0.3);
}

.group.destructive .group-\[\.destructive\]\:hover\:bg-destructive:hover{
    background-color: hsl(var(--destructive));
}

.group.destructive .group-\[\.destructive\]\:hover\:text-destructive-foreground:hover{
    color: hsl(var(--destructive-foreground));
}

.group.destructive .group-\[\.destructive\]\:hover\:text-red-50:hover{
    --tw-text-opacity: 1;
    color: rgb(254 242 242 / var(--tw-text-opacity, 1));
}

.group.destructive .group-\[\.destructive\]\:focus\:ring-destructive:focus{
    --tw-ring-color: hsl(var(--destructive));
}

.group.destructive .group-\[\.destructive\]\:focus\:ring-red-400:focus{
    --tw-ring-opacity: 1;
    --tw-ring-color: rgb(248 113 113 / var(--tw-ring-opacity, 1));
}

.group.destructive .group-\[\.destructive\]\:focus\:ring-offset-red-600:focus{
    --tw-ring-offset-color: #dc2626;
}

.data-\[disabled\]\:pointer-events-none[data-disabled]{
    pointer-events: none;
}

.data-\[side\=bottom\]\:translate-y-1[data-side="bottom"]{
    --tw-translate-y: 0.25rem;
    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.data-\[side\=left\]\:-translate-x-1[data-side="left"]{
    --tw-translate-x: -0.25rem;
    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.data-\[side\=right\]\:translate-x-1[data-side="right"]{
    --tw-translate-x: 0.25rem;
    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.data-\[side\=top\]\:-translate-y-1[data-side="top"]{
    --tw-translate-y: -0.25rem;
    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.data-\[state\=checked\]\:translate-x-5[data-state="checked"]{
    --tw-translate-x: 1.25rem;
    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.data-\[state\=unchecked\]\:translate-x-0[data-state="unchecked"]{
    --tw-translate-x: 0px;
    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.data-\[swipe\=cancel\]\:translate-x-0[data-swipe="cancel"]{
    --tw-translate-x: 0px;
    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.data-\[swipe\=end\]\:translate-x-\[var\(--radix-toast-swipe-end-x\)\][data-swipe="end"]{
    --tw-translate-x: var(--radix-toast-swipe-end-x);
    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.data-\[swipe\=move\]\:translate-x-\[var\(--radix-toast-swipe-move-x\)\][data-swipe="move"]{
    --tw-translate-x: var(--radix-toast-swipe-move-x);
    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.data-\[disabled\]\:cursor-not-allowed[data-disabled]{
    cursor: not-allowed;
}

.data-\[state\=checked\]\:bg-blue-50[data-state="checked"]{
    --tw-bg-opacity: 1;
    background-color: rgb(239 246 255 / var(--tw-bg-opacity, 1));
}

.data-\[state\=checked\]\:bg-primary[data-state="checked"]{
    background-color: hsl(var(--primary));
}

.data-\[state\=open\]\:bg-accent[data-state="open"]{
    background-color: hsl(var(--accent));
}

.data-\[state\=unchecked\]\:bg-input[data-state="unchecked"]{
    background-color: hsl(var(--input));
}

.data-\[state\=checked\]\:font-medium[data-state="checked"]{
    font-weight: 500;
}

.data-\[state\=checked\]\:text-blue-900[data-state="checked"]{
    --tw-text-opacity: 1;
    color: rgb(30 58 138 / var(--tw-text-opacity, 1));
}

.data-\[state\=checked\]\:text-primary-foreground[data-state="checked"]{
    color: hsl(var(--primary-foreground));
}

.data-\[state\=open\]\:text-muted-foreground[data-state="open"]{
    color: hsl(var(--muted-foreground));
}

.data-\[disabled\]\:opacity-40[data-disabled]{
    opacity: 0.4;
}

.data-\[swipe\=move\]\:transition-none[data-swipe="move"]{
    transition-property: none;
}

.data-\[state\=open\]\:animate-in[data-state="open"] {
    animation-duration: 0.3s;
    animation-fill-mode: both;
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }

.data-\[state\=open\]\:fade-in-0[data-state="open"] {
    animation-name: fadeIn;
  }

.data-\[state\=open\]\:zoom-in-95[data-state="open"] {
    animation-name: zoomIn;
  }

.dark\:border-destructive:is([data-theme="dark"] *){
    border-color: hsl(var(--destructive));
}

.dark\:border-gray-700:is([data-theme="dark"] *){
    --tw-border-opacity: 1;
    border-color: rgb(55 65 81 / var(--tw-border-opacity, 1));
}

.dark\:bg-gray-900:is([data-theme="dark"] *){
    --tw-bg-opacity: 1;
    background-color: rgb(17 24 39 / var(--tw-bg-opacity, 1));
}

.dark\:text-gray-100:is([data-theme="dark"] *){
    --tw-text-opacity: 1;
    color: rgb(243 244 246 / var(--tw-text-opacity, 1));
}

@media (min-width: 640px){

    .sm\:bottom-0{
        bottom: 0px;
    }

    .sm\:right-0{
        right: 0px;
    }

    .sm\:top-auto{
        top: auto;
    }

    .sm\:max-w-md{
        max-width: 28rem;
    }

    .sm\:flex-row{
        flex-direction: row;
    }

    .sm\:flex-col{
        flex-direction: column;
    }

    .sm\:justify-end{
        justify-content: flex-end;
    }

    .sm\:space-x-2 > :not([hidden]) ~ :not([hidden]){
        --tw-space-x-reverse: 0;
        margin-right: calc(0.5rem * var(--tw-space-x-reverse));
        margin-left: calc(0.5rem * calc(1 - var(--tw-space-x-reverse)));
    }

    .sm\:rounded-lg{
        border-radius: var(--radius);
    }

    .sm\:text-left{
        text-align: left;
    }
}

@media (min-width: 768px){

    .md\:block{
        display: block;
    }

    .md\:max-w-\[420px\]{
        max-width: 420px;
    }
}

.\[\&\>span\]\:line-clamp-1>span{
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
}

.\[\&\>svg\+div\]\:translate-y-\[-3px\]>svg+div{
    --tw-translate-y: -3px;
    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.\[\&\>svg\]\:absolute>svg{
    position: absolute;
}

.\[\&\>svg\]\:left-4>svg{
    left: 1rem;
}

.\[\&\>svg\]\:top-4>svg{
    top: 1rem;
}

.\[\&\>svg\]\:text-destructive>svg{
    color: hsl(var(--destructive));
}

.\[\&\>svg\]\:text-foreground>svg{
    color: hsl(var(--foreground));
}

.\[\&\>svg\~\*\]\:pl-7>svg~*{
    padding-left: 1.75rem;
}

.\[\&_p\]\:leading-relaxed p{
    line-height: 1.625;
}
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
:root {
  --base-spacing: 24px;
  --m-xxxxs: calc(var(--base-spacing) / 5);
  --m-xxxs: calc(var(--base-spacing) / 4);
  --m-xxs: calc(var(--base-spacing) / 3);
  --m-xs: calc(var(--base-spacing) / 2);
  --m-s: calc(var(--base-spacing) * 2 / 3);
  --m: var(--base-spacing);
  --m-mm: calc(var(--base-spacing) * 3 / 2);
  --m-l: calc(var(--base-spacing) * 5 / 3);
  --m-xl: calc(var(--base-spacing) * 2);
  --m-xxl: calc(var(--base-spacing) * 5 / 2);
  --m-xxxl: calc(var(--base-spacing) * 3);
  --font-size-xs: calc(var(--font-size) * 16 / 17);
  --font-size-s: calc(var(--font-size) * 13 / 14);
  --font-size: 0.875rem;
  --font-size-l: calc(var(--font-size) * 8 / 7);
  --font-size-xl: calc(var(--font-size) * 9 / 7);
  --font-size-xxl: calc(var(--font-size) * 12 / 7);
  --font-size-xxxl: calc(var(--font-size) * 18 / 7);
  --font-size-h: calc(var(--font-size) * 24 / 7);
  --font-family: "Inter", sans-serif;
  --font-family-1: var(--font-family);
  --font-family-2: "Laxan", sans-serif;
  --border-radius: 4px;
  --border-radius-1: var(--border-radius);
  --border-radius-2: calc(var(--border-radius) * 2);
  --border-radius-3: calc(var(--border-radius) * 3);
  --border-radius-4: calc(var(--border-radius) * 4);
  --border-radius-5: calc(var(--border-radius) * 5);
  --border-radius-r: 50%;
  --fast: 0.3s;
  --speed: 0.4s;
  --slow: 0.9s;
  --ease: ease-out;
  --transition-ui: background-color var(--fast) var(--ease), border-color var(--fast) var(--ease), opacity var(--fast) var(--ease),
    transform var(--fast) var(--ease), color var(--fast) var(--ease);
  --blurred: 5px;
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-focus: #2563eb;
  --color-primary-disabled: #bfdbfe;
  --color-primary-button-disabled: #3f3b55;
  --color-secondary: #1d2939;
  --color-secondary-hover: #475467;
  --color-secondary-focus: #1d2939;
  --color-secondary-disabled: #344054;
  --color-text-on-primary: #ffffff;
  --color-text-on-primary-disabled: #667085;
  --color-text-on-primary-button-disabled: #ffffff;
  --color-text-on-secondary: #f2f4f7;
  --color-text-on-secondary-disabled: #475467;
  --color-progress-bar: #099250;
  --color-success: rgba(18, 183, 106, 0.88);
  --color-emphasis: #0ba5ec;
  --color-error: rgba(252, 93, 93, 0.88);
  --color-attention: rgba(248, 203, 44, 0.88);
  --color-importer-link: #2275d7;
  --blue-light-500: #0ba5ec;
  --color-green-ui: var(--color-progress-bar);
  --color-green: var(--color-success);
  --color-blue: #0ba5ec;
  --color-red: rgba(252, 93, 93, 0.88);
  --color-yellow: rgba(248, 203, 44, 0.88);
  --importer-link: var(--color-importer-link);
}
.CSVImporter-dark {
  color-scheme: dark;
  --color-background: #0e1116;
  --color-background-main: var(--color-background);
  --color-background-modal: #171a20;
  --color-background-modal-hover: #2e323c;
  --color-background-modal-veil: #0e1116;
  --color-background-modal-shadow: #0e1116;
  --color-background-modal-shade: #171a20;
  --color-tertiary: #101828;
  --color-tertiary-hover: #1d2939;
  --color-tertiary-focus: #1d2939;
  --color-tertiary-disabled: #eaecf0;
  --color-background-menu: #101828;
  --color-background-menu-hover: #1d2939;
  --color-text-strong: #f2f4f7;
  --color-text: #d0d5dd;
  --color-text-soft: #667085;
  --color-text-on-tertiary: #ffffff;
  --color-text-on-tertiary-disabled: #667085;
  --color-error: #912018;
  --color-text-error: #f04438;
  --color-background-error: #f04438;
  --color-background-error-hover: #d92d20;
  --color-background-error-soft: #fecdca;
  --color-input-background: #101828;
  --color-input-background-soft: #1d2939;
  --color-input-border: #344054;
  --color-input-placeholder: #344054;
  --color-input-text-disabled: #344054;
  --color-input-disabled: #171a20;
  --color-border: #1d2939;
  --color-background-small-button-selected: #344054;
  --color-background-small-button-hover: #101828;
  --color-text-small-button: \$base-white;
  --color-button: #eff6ff;
  --color-button-hover: #dbeafe;
  --color-button-disabled: #dbeafe;
  --color-button-text: #171a20;
  --color-button-text-disabled: lighter(#171a20, 10);
  --color-button-border: transparent;
  --color-border: #344054;
  --color-border-soft: #1d2939;
  --color-icon: #d0d5dd;
  --color-bisel: rgba(255, 255, 255, 0.05);
  --color-csv-import-text: var(--color-text);
  --color-stepper: #30374f;
  --color-stepper-active: #6ce9a6;
}
.CSVImporter-light {
  color-scheme: light;
  --color-background: #f2f4f7;
  --color-background-main: #ffffff;
  --color-background-modal: #ffffff;
  --color-background-modal-hover: #ffffff;
  --color-background-modal-veil: #0e1116;
  --color-background-modal-shadow: transparent;
  --color-background-modal-shade: #f2f4f7;
  --color-tertiary: #ffffff;
  --color-tertiary-hover: #f2f4f7;
  --color-tertiary-focus: #ffffff;
  --color-tertiary-disabled: #eaecf0;
  --color-background-menu: #ffffff;
  --color-background-menu-hover: #f2f4f7;
  --color-text-strong: #101828;
  --color-text: #1d2939;
  --color-text-soft: #667085;
  --color-text-on-tertiary: #344054;
  --color-text-on-tertiary-disabled: #667085;
  --color-error: #fecdca;
  --color-text-error: #f04438;
  --color-background-error: #f04438;
  --color-background-error-hover: #d92d20;
  --color-background-error-soft: #fecdca;
  --color-input-background: #ffffff;
  --color-input-background-soft: #d0d5dd;
  --color-input-border: #344054;
  --color-input-placeholder: #344054;
  --color-input-text-disabled: #344054;
  --color-input-disabled: #f9fafb;
  --color-border: #1d2939;
  --color-background-small-button-selected: #f2f4f7;
  --color-background-small-button-hover: #f9fafb;
  --color-text-small-button: var(--color-text);
  --color-button: #ffffff;
  --color-button-hover: #f2f4f7;
  --color-button-disabled: #fcfcfd;
  --color-button-text: var(--color-text-soft);
  --color-button-text-disabled: #d0d5dd;
  --color-button-border: #d0d5dd;
  --color-border: #d0d5dd;
  --color-border-soft: #eaecf0;
  --color-icon: #101323;
  --color-bisel: rgba(0, 0, 0, 0.05);
  --color-csv-import-text: #130638;
  --color-stepper: #b9c0d4;
  --color-stepper-active: #6ce9a6;
}
.csv-importer {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: var(--font-size);
  font-weight: 500;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.csv-importer * {
  box-sizing: border-box;
}
.csv-importer .container {
  max-width: 1300px;
  margin: 0 auto;
  padding: 2rem;
}
@media (max-width: 640px) {
  .csv-importer .container {
    padding: 1rem;
  }
}
.csv-importer h1, .csv-importer h2, .csv-importer h3, .csv-importer h4, .csv-importer h5, .csv-importer h6 {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
  font-weight: 600;
  line-height: 1.2;
  color: #111827;
}
.csv-importer h1 {
  font-size: 2rem;
}
.csv-importer h2 {
  font-size: 1.5rem;
}
.csv-importer h3 {
  font-size: 1.25rem;
}
.csv-importer h4 {
  font-size: 1.125rem;
}
.csv-importer h5 {
  font-size: 1rem;
}
.csv-importer h6 {
  font-size: 0.875rem;
}
.csv-importer p {
  line-height: 1.6;
  color: #4B5563;
}
.csv-importer button {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
  font-weight: 500;
  transition: all 0.2s ease;
}
.csv-importer button:hover:not(:disabled) {
  transform: translateY(-1px);
}
.csv-importer input, .csv-importer textarea, .csv-importer select {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
  font-size: 0.875rem;
}
.csv-importer input:focus, .csv-importer textarea:focus, .csv-importer select:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 122, 94, 248), 0.1);
}
.csv-importer a {
  color: var(--color-primary);
  text-decoration: none;
  transition: color 0.2s ease;
}
.csv-importer a:hover {
  color: var(--color-primary-700);
  text-decoration: underline;
}
.CSVImporter {
  border: none;
  background-color: transparent;
  padding: 0 1rem;
  border-radius: 1.2rem;
  color: inherit;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  /* height: 2.4rem; */
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  transition: filter 0.2s ease-out;
}

.CSVImporter svg {
  display: block;
}

.CSVImporter svg path {
  stroke: currentColor !important;
}

.CSVImporter:hover,
.CSVImporter:active {
  filter: brightness(1.2);
}

.CSVImporter-dialog::backdrop {
  background-color: rgba(0, 0, 0, 0.85);
}

.CSVImporter-dialog {
  border-radius: 1rem;
  width: 80vw;
  max-height: 80vh;
  min-width: 800px;
  border: none;
  position: fixed;
  inset: 0;
  padding: 0;
  margin: auto;
}

.CSVImporter-div {
  border: none;
  display: block;
  width: 100%;
  height: auto;
  max-height: 80vh;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .CSVImporter-dialog {
    width: 95vw;
    min-width: unset;
    max-width: 100%;
  }
}
`;
