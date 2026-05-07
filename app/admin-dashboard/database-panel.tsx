"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function DatabasePanel() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newItem, setNewItem] = useState({ name: "", value: "" })
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Mock data for now
      setData([
        { id: "1", name: "User Count", value: "42" },
        { id: "2", name: "Transaction Count", value: "156" },
        { id: "3", name: "Total Balance", value: "₹24,500" },
      ])
      setNotification({ message: "Data loaded successfully", type: "success" })
    } catch (e: any) {
      setError(e.message)
      setNotification({ message: `Error fetching data: ${e.message}`, type: "error" })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: any) => {
    setNewItem({ ...newItem, [e.target.name]: e.target.value })
  }

  const addItem = async () => {
    try {
      // Mock adding item
      const newId = (data.length + 1).toString()
      setData([...data, { id: newId, ...newItem }])
      setNotification({ message: "Item added successfully", type: "success" })
      setNewItem({ name: "", value: "" })
    } catch (e: any) {
      setError(e.message)
      setNotification({ message: `Error adding item: ${e.message}`, type: "error" })
    }
  }

  const deleteItem = async (id: string) => {
    try {
      // Mock delete
      setData(data.filter((item) => item.id !== id))
      setNotification({ message: "Item deleted successfully", type: "success" })
    } catch (e: any) {
      setError(e.message)
      setNotification({ message: `Error deleting item: ${e.message}`, type: "error" })
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <Card>
      {notification && (
        <div
          className={`p-3 m-4 rounded-md ${
            notification.type === "error" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
          }`}
        >
          {notification.message}
        </div>
      )}

      <CardHeader>
        <CardTitle>Database Panel</CardTitle>
        <CardDescription>Manage database records and statistics</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Add New Item</h3>
          <div className="grid gap-2 grid-cols-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input type="text" id="name" name="name" value={newItem.name} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="value">Value</Label>
              <Input type="text" id="value" name="value" value={newItem.value} onChange={handleInputChange} />
            </div>
          </div>
          <Button onClick={addItem} className="mt-4">
            Add Item
          </Button>
        </div>

        <Table>
          <TableCaption>A list of your data.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.value}</TableCell>
                <TableCell className="text-right">
                  <Button variant="destructive" onClick={() => deleteItem(item.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default DatabasePanel
