import { Router } from 'express';
import { WizardController } from '../controllers/wizardController';
import { GraphDBRepository } from '../repositories/graphDBRepository';
import { WizardService } from '../services/wizardService';

/**
 * 向导路由
 */
export const createWizardRoutes = (): Router => {
  const router = Router();
  
  // 依赖注入
  const graphDBRepository = new GraphDBRepository();
  const wizardService = new WizardService(graphDBRepository);
  const wizardController = new WizardController(wizardService);

  // 路由定义
  router.post('/preview', wizardController.previewWizardData);
  router.post('/submit', wizardController.submitWizardData);
  router.post('/validate-draft', wizardController.validateDraft);
  router.get('/template', wizardController.generateTemplate);

  return router;
};