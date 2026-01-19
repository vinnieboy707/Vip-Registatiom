import logger from '../config/logger';
import vehicleService from './vehicleService';
import dmvService from './dmvService';
import recallService from './recallService';
import { RegistrationRecord, OwnershipHistory } from '../types';

/**
 * Report Service - Generates comprehensive vehicle reports
 * Includes VIN data, ownership history, recalls, registration status, and more
 */
class ReportService {
  /**
   * Generate comprehensive vehicle report by VIN
   */
  async generateVehicleReport(vin: string): Promise<any> {
    try {
      logger.info(`Generating comprehensive report for VIN: ${vin}`);

      // Fetch vehicle data from DMV/NHTSA
      const vehicleData = await dmvService.getVehicleByVIN(vin);
      
      // Check database for existing records
      let dbVehicle = await vehicleService.getVehicleByVIN(vin, false);
      
      // Get recall data from NHTSA
      const recallData = await recallService.hasOpenRecalls(vin);
      
      // Get ownership history if vehicle exists in DB
      let ownershipHistory: OwnershipHistory[] = [];
      let registrationRecords: RegistrationRecord[] = [];
      
      if (dbVehicle) {
        ownershipHistory = await vehicleService.getOwnershipHistory(dbVehicle.id);
        registrationRecords = await vehicleService.getRegistrationRecords(dbVehicle.id);
      }

      // Check stolen status
      const isStolenCheck = await dmvService.checkStolenStatus(vin);

      const report = {
        reportGeneratedAt: new Date().toISOString(),
        reportType: 'COMPREHENSIVE_VEHICLE_REPORT',
        
        // Vehicle Information
        vehicleInfo: {
          vin: vin,
          make: vehicleData.make,
          model: vehicleData.model,
          year: vehicleData.year,
          color: vehicleData.color || 'Not specified',
          registrationStatus: vehicleData.registration_status,
          registrationExpiry: vehicleData.registration_expiry || 'N/A'
        },

        // Current Owner Information
        currentOwner: {
          name: vehicleData.owner_name || dbVehicle?.current_owner_name || 'Not available',
          address: vehicleData.owner_address || dbVehicle?.current_owner_address || 'Not available',
          ownershipDate: ownershipHistory.length > 0 ? ownershipHistory[0].start_date : 'N/A'
        },

        // Ownership History
        ownershipHistory: ownershipHistory.map(owner => ({
          ownerName: owner.owner_name,
          ownerAddress: owner.owner_address || 'Not specified',
          startDate: owner.start_date,
          endDate: owner.end_date || 'Current',
          transferType: 'N/A' // Transfer type not in base schema
        })),

        // Previous Owners Summary
        previousOwnersSummary: {
          totalPreviousOwners: ownershipHistory.length > 1 ? ownershipHistory.length - 1 : 0,
          ownershipChainComplete: ownershipHistory.length > 0
        },

        // Registration Records
        registrationHistory: registrationRecords.map(record => ({
          registrationType: record.registration_type,
          registrationDate: record.registration_date,
          expiryDate: record.expiry_date,
          totalFee: record.total_fee,
          locationFiled: record.location_filed || 'N/A',
          agentId: record.agent_id || 'N/A'
        })),

        // Title Information
        titleInfo: {
          titleNumber: vehicleData.title_info?.title_number || 'Not available',
          issueDate: vehicleData.title_info?.issue_date || 'Not available',
          titleStatus: dbVehicle?.registration_status || 'Not available'
        },

        // Safety & Recall Information
        safetyInfo: {
          isStolen: isStolenCheck || vehicleData.is_stolen,
          stolenStatus: isStolenCheck || vehicleData.is_stolen ? 'STOLEN - DO NOT PURCHASE' : 'Not reported stolen',
          hasRecalls: recallData.hasRecalls,
          recallCount: recallData.count,
          recalls: recallData.recalls
        },

        // Report Summary
        summary: {
          vehicleCondition: this.determineVehicleCondition(vehicleData, isStolenCheck, recallData),
          recommendationsForBuyer: this.generateRecommendations(vehicleData, isStolenCheck, recallData, ownershipHistory),
          riskLevel: this.assessRiskLevel(isStolenCheck, recallData, ownershipHistory)
        }
      };

      logger.info(`Report generated successfully for VIN: ${vin}`);
      return report;
    } catch (error: any) {
      logger.error('Error generating vehicle report:', error);
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }

  /**
   * Generate report by license plate
   */
  async generateReportByPlate(plate: string, state: string): Promise<any> {
    try {
      logger.info(`Generating report for plate: ${plate}, state: ${state}`);

      const vehicleData = await dmvService.getVehicleByPlate(plate, state);
      
      if (vehicleData && vehicleData.vin) {
        return await this.generateVehicleReport(vehicleData.vin);
      }

      throw new Error('Vehicle not found for license plate');
    } catch (error: any) {
      logger.error('Error generating report by plate:', error);
      throw new Error(`Failed to generate report by plate: ${error.message}`);
    }
  }

  /**
   * Determine overall vehicle condition
   */
  private determineVehicleCondition(vehicleData: any, isStolen: boolean, recallData: any): string {
    if (isStolen) {
      return 'STOLEN - DO NOT PURCHASE OR TRANSFER';
    }

    if (recallData.hasRecalls && recallData.count > 3) {
      return 'MULTIPLE SAFETY RECALLS - VERIFY COMPLETION BEFORE PURCHASE';
    }

    if (recallData.hasRecalls) {
      return 'ACTIVE RECALLS - CHECK WITH MANUFACTURER';
    }

    if (vehicleData.registration_status === 'expired') {
      return 'EXPIRED REGISTRATION - RENEWAL REQUIRED';
    }

    if (vehicleData.registration_status === 'active') {
      return 'ACTIVE REGISTRATION - GOOD STANDING';
    }

    return 'STANDARD CONDITION - VERIFY DETAILS';
  }

  /**
   * Generate recommendations for buyers
   */
  private generateRecommendations(vehicleData: any, isStolen: boolean, recallData: any, ownershipHistory: any[]): string[] {
    const recommendations: string[] = [];

    if (isStolen) {
      recommendations.push('⛔ DO NOT PURCHASE - Vehicle reported stolen');
      recommendations.push('Contact local law enforcement immediately');
      return recommendations;
    }

    if (recallData.hasRecalls) {
      recommendations.push(`⚠️ ${recallData.count} open recall(s) found - verify completion with manufacturer`);
      recommendations.push('Request recall completion documentation before purchase');
    }

    if (ownershipHistory.length > 5) {
      recommendations.push('⚠️ Multiple previous owners - request detailed history');
    }

    if (vehicleData.registration_status === 'expired') {
      recommendations.push('Registration is expired - factor renewal costs into purchase');
    }

    if (!vehicleData.title_info?.title_number) {
      recommendations.push('⚠️ Title information incomplete - verify clean title');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ No major issues found - standard due diligence recommended');
      recommendations.push('Consider professional inspection before purchase');
    }

    return recommendations;
  }

  /**
   * Assess overall risk level
   */
  private assessRiskLevel(isStolen: boolean, recallData: any, ownershipHistory: any[]): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (isStolen) {
      return 'HIGH';
    }

    if (recallData.count > 3 || ownershipHistory.length > 7) {
      return 'MEDIUM';
    }

    if (recallData.count > 0 || ownershipHistory.length > 4) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  /**
   * Format report as text for printing/PDF
   */
  formatReportAsText(report: any): string {
    let text = '';
    
    text += '═══════════════════════════════════════════════════════════\n';
    text += '          COMPREHENSIVE VEHICLE HISTORY REPORT\n';
    text += '═══════════════════════════════════════════════════════════\n\n';
    text += `Report Generated: ${new Date(report.reportGeneratedAt).toLocaleString()}\n`;
    text += `Report Type: ${report.reportType}\n\n`;
    
    text += '───────────────────────────────────────────────────────────\n';
    text += 'VEHICLE INFORMATION\n';
    text += '───────────────────────────────────────────────────────────\n';
    text += `VIN: ${report.vehicleInfo.vin}\n`;
    text += `Year: ${report.vehicleInfo.year}\n`;
    text += `Make: ${report.vehicleInfo.make}\n`;
    text += `Model: ${report.vehicleInfo.model}\n`;
    text += `Color: ${report.vehicleInfo.color}\n`;
    text += `Registration Status: ${report.vehicleInfo.registrationStatus}\n`;
    text += `Registration Expiry: ${report.vehicleInfo.registrationExpiry}\n\n`;
    
    text += '───────────────────────────────────────────────────────────\n';
    text += 'CURRENT OWNER\n';
    text += '───────────────────────────────────────────────────────────\n';
    text += `Name: ${report.currentOwner.name}\n`;
    text += `Address: ${report.currentOwner.address}\n`;
    text += `Ownership Date: ${report.currentOwner.ownershipDate}\n\n`;
    
    if (report.ownershipHistory.length > 0) {
      text += '───────────────────────────────────────────────────────────\n';
      text += 'OWNERSHIP HISTORY\n';
      text += '───────────────────────────────────────────────────────────\n';
      text += `Total Previous Owners: ${report.previousOwnersSummary.totalPreviousOwners}\n\n`;
      
      report.ownershipHistory.forEach((owner: any, index: number) => {
        text += `Owner ${index + 1}:\n`;
        text += `  Name: ${owner.ownerName}\n`;
        text += `  From: ${owner.startDate} To: ${owner.endDate}\n`;
        text += `  Transfer Type: ${owner.transferType}\n\n`;
      });
    }
    
    text += '───────────────────────────────────────────────────────────\n';
    text += 'SAFETY & RECALL INFORMATION\n';
    text += '───────────────────────────────────────────────────────────\n';
    text += `Stolen Status: ${report.safetyInfo.stolenStatus}\n`;
    text += `Has Recalls: ${report.safetyInfo.hasRecalls ? 'YES' : 'NO'}\n`;
    text += `Number of Recalls: ${report.safetyInfo.recallCount}\n\n`;
    
    if (report.safetyInfo.recalls.length > 0) {
      text += 'RECALL DETAILS:\n';
      report.safetyInfo.recalls.forEach((recall: any, index: number) => {
        text += `\nRecall ${index + 1}:\n`;
        text += `  Campaign #: ${recall.nhtsaCampaignNumber}\n`;
        text += `  Component: ${recall.component}\n`;
        text += `  Summary: ${recall.summary}\n`;
        text += `  Remedy: ${recall.remedy}\n`;
        text += `  Date: ${recall.recallDate}\n`;
      });
      text += '\n';
    }
    
    text += '───────────────────────────────────────────────────────────\n';
    text += 'REPORT SUMMARY\n';
    text += '───────────────────────────────────────────────────────────\n';
    text += `Vehicle Condition: ${report.summary.vehicleCondition}\n`;
    text += `Risk Level: ${report.summary.riskLevel}\n\n`;
    text += 'RECOMMENDATIONS:\n';
    report.summary.recommendationsForBuyer.forEach((rec: string) => {
      text += `  ${rec}\n`;
    });
    
    text += '\n═══════════════════════════════════════════════════════════\n';
    text += '              END OF REPORT\n';
    text += '═══════════════════════════════════════════════════════════\n';
    
    return text;
  }
}

export default new ReportService();
