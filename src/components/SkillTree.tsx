import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Alert, AlertDescription } from './ui/alert'
import type { SkillNode, PlayerProgression } from '../types/progression'

interface SkillTreeProps {
  skills: SkillNode[]
  progression: PlayerProgression
  onUnlockSkill: (skillId: string) => Promise<{ success: boolean; error?: string }>
}

export function SkillTree({ skills, progression, onUnlockSkill }: SkillTreeProps) {
  const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null)
  const [unlocking, setUnlocking] = useState<string | null>(null)

  const handleUnlockSkill = async (skillId: string) => {
    setUnlocking(skillId)
    try {
      const result = await onUnlockSkill(skillId)
      if (!result.success && result.error) {
        // Handle error - could show a toast notification
        console.error('Failed to unlock skill:', result.error)
      }
    } finally {
      setUnlocking(null)
    }
  }

  const isSkillAvailable = (skill: SkillNode) => {
    if (skill.unlocked) return false
    
    // Check if player has enough skill points
    if (progression.skillPoints < skill.cost) return false
    
    // Check prerequisites
    return skill.prerequisites.every(prereqId => 
      skills.find(s => s.id === prereqId && s.unlocked)
    )
  }

  const getSkillsByBranch = () => {
    const branches = {
      speed: skills.filter(s => s.id.startsWith('speed_')),
      defense: skills.filter(s => s.id.startsWith('defense_')),
      attack: skills.filter(s => s.id.startsWith('attack_')),
      utility: skills.filter(s => s.id.startsWith('utility_'))
    }
    return branches
  }

  const branches = getSkillsByBranch()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Skill Tree</h2>
          <p className="text-gray-600">Enhance your octopus abilities</p>
        </div>
        <div className="text-right">
          <Badge className="bg-blue-100 text-blue-800 text-lg px-3 py-1">
            🔧 {progression.skillPoints} Skill Points
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SkillBranch
          title="Speed"
          icon="💨"
          color="bg-blue-50 border-blue-200"
          skills={branches.speed}
          progression={progression}
          onSkillClick={setSelectedSkill}
          isSkillAvailable={isSkillAvailable}
        />
        
        <SkillBranch
          title="Defense"
          icon="🛡️"
          color="bg-green-50 border-green-200"
          skills={branches.defense}
          progression={progression}
          onSkillClick={setSelectedSkill}
          isSkillAvailable={isSkillAvailable}
        />
        
        <SkillBranch
          title="Attack"
          icon="⚔️"
          color="bg-red-50 border-red-200"
          skills={branches.attack}
          progression={progression}
          onSkillClick={setSelectedSkill}
          isSkillAvailable={isSkillAvailable}
        />
        
        <SkillBranch
          title="Utility"
          icon="🔮"
          color="bg-purple-50 border-purple-200"
          skills={branches.utility}
          progression={progression}
          onSkillClick={setSelectedSkill}
          isSkillAvailable={isSkillAvailable}
        />
      </div>

      <SkillDetailDialog
        skill={selectedSkill}
        progression={progression}
        onUnlockSkill={handleUnlockSkill}
        unlocking={unlocking}
        isAvailable={selectedSkill ? isSkillAvailable(selectedSkill) : false}
        onClose={() => setSelectedSkill(null)}
      />
    </div>
  )
}

interface SkillBranchProps {
  title: string
  icon: string
  color: string
  skills: SkillNode[]
  progression: PlayerProgression
  onSkillClick: (skill: SkillNode) => void
  isSkillAvailable: (skill: SkillNode) => boolean
}

function SkillBranch({ 
  title, 
  icon, 
  color, 
  skills, 
  progression, 
  onSkillClick,
  isSkillAvailable 
}: SkillBranchProps) {
  return (
    <Card className={`${color} h-fit`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <span className="text-2xl">{icon}</span>
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {skills.map((skill, index) => (
          <div key={skill.id} className="relative">
            {index > 0 && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3 w-px h-3 bg-gray-300" />
            )}
            <SkillNode
              skill={skill}
              progression={progression}
              isAvailable={isSkillAvailable(skill)}
              onClick={() => onSkillClick(skill)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

interface SkillNodeProps {
  skill: SkillNode
  progression: PlayerProgression
  isAvailable: boolean
  onClick: () => void
}

function SkillNode({ skill, progression, isAvailable, onClick }: SkillNodeProps) {
  const getNodeStyle = () => {
    if (skill.unlocked) {
      return 'bg-yellow-100 border-yellow-300 text-yellow-800 shadow-md'
    } else if (isAvailable) {
      return 'bg-white border-blue-300 text-blue-800 hover:bg-blue-50 cursor-pointer shadow-sm'
    } else {
      return 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
    }
  }

  return (
    <div
      className={`
        p-3 rounded-lg border-2 text-center transition-all duration-200 
        ${getNodeStyle()}
        ${isAvailable || skill.unlocked ? 'transform hover:scale-105' : ''}
      `}
      onClick={isAvailable || skill.unlocked ? onClick : undefined}
    >
      <div className="font-medium text-sm mb-1">{skill.name}</div>
      <div className="flex items-center justify-center space-x-1">
        <span className="text-xs">🔧</span>
        <span className="text-xs font-bold">{skill.cost}</span>
      </div>
      {skill.unlocked && (
        <div className="mt-1">
          <Badge className="bg-green-100 text-green-800 text-xs">✓</Badge>
        </div>
      )}
    </div>
  )
}

interface SkillDetailDialogProps {
  skill: SkillNode | null
  progression: PlayerProgression
  onUnlockSkill: (skillId: string) => Promise<void>
  unlocking: string | null
  isAvailable: boolean
  onClose: () => void
}

function SkillDetailDialog({ 
  skill, 
  progression, 
  onUnlockSkill, 
  unlocking, 
  isAvailable, 
  onClose 
}: SkillDetailDialogProps) {
  if (!skill) return null

  return (
    <Dialog open={!!skill} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>{skill.name}</span>
            {skill.unlocked && (
              <Badge className="bg-green-100 text-green-800">Unlocked</Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-gray-600">{skill.description}</p>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium mb-2">Effect:</h4>
            <p className="text-sm text-gray-700">{skill.effect.description}</p>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span>Cost:</span>
            <div className="flex items-center space-x-1">
              <span>🔧</span>
              <span className="font-bold">{skill.cost}</span>
            </div>
          </div>
          
          {skill.prerequisites.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Prerequisites:</h4>
              <div className="space-y-1">
                {skill.prerequisites.map(prereqId => {
                  const prereqSkill = progression.skillPoints >= 0 ? 'Required skill' : prereqId
                  return (
                    <div key={prereqId} className="text-sm text-gray-600">
                      • {prereqSkill}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {!skill.unlocked && (
            <div className="space-y-2">
              {progression.skillPoints < skill.cost && (
                <Alert>
                  <AlertDescription>
                    Need {skill.cost - progression.skillPoints} more skill points
                  </AlertDescription>
                </Alert>
              )}
              
              {isAvailable && (
                <Button
                  onClick={() => onUnlockSkill(skill.id)}
                  disabled={unlocking === skill.id}
                  className="w-full"
                >
                  {unlocking === skill.id ? 'Unlocking...' : `Unlock for ${skill.cost} points`}
                </Button>
              )}
              
              {!isAvailable && progression.skillPoints >= skill.cost && (
                <Alert>
                  <AlertDescription>
                    Complete prerequisite skills first
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}